import { extname } from 'path';
import { basename } from 'path';
import slugify from '@sindresorhus/slugify';
import titleize from 'titleize';
import { findIcon } from '../icons.js';
import { joinPaths, last, parseDataFile, stripTopPath } from '../utility.js';
import { getCollectionPaths } from '../collections.js';

export default class Ssg {
	/** @type {import('@cloudcannon/configuration-types').SsgKey} */
	key;

	/**
	 * @param key {import('@cloudcannon/configuration-types').SsgKey | undefined=}
	 */
	constructor(key) {
		this.key = key || 'other';
	}

	/**
	 * Provides a summary of files.
	 *
	 * @param filePaths {string[]} The input file path.
	 * @returns {import('../types').GroupedFileSummaries} The file summaries grouped by type.
	 */
	groupFiles(filePaths) {
		/** @type {Record<string, number>} */
		const collectionPathCounts = {};

		/** @type {Record<import('../types').FileType, import('../types').FileSummary[]>} */
		const groups = {
			config: [],
			content: [],
			partial: [],
			other: [],
			template: [],
			ignored: [],
		};

		for (let i = 0; i < filePaths.length; i++) {
			const summary = {
				filePath: filePaths[i],
				type: this.getFileType(filePaths[i]),
			};

			if (summary.type === 'content') {
				const lastPath = last(getCollectionPaths(filePaths[i]));
				if (lastPath || lastPath === '') {
					collectionPathCounts[lastPath] = collectionPathCounts[lastPath] || 0;
					collectionPathCounts[lastPath] += 1;
				}
			}

			if (summary.type !== 'ignored') {
				groups[summary.type].push(summary);
			}
		}

		return { collectionPathCounts, groups };
	}

	/** @type {string[]} */
	conventionalPathsInSource = [];

	/**
	 * Attempts to find the most likely source folder for a Jekyll site.
	 *
	 * @param filePaths {string[]} List of input file paths.
	 * @returns {{ filePath?: string, conventionPath?: string }}
	 */
	findConventionPath(filePaths) {
		for (let i = 0; i < filePaths.length; i++) {
			for (let j = 0; j < this.conventionalPathsInSource.length; j++) {
				if (
					filePaths[i].startsWith(this.conventionalPathsInSource[j]) ||
					filePaths[i].includes(`/${this.conventionalPathsInSource[j]}`)
				) {
					return {
						filePath: filePaths[i],
						conventionPath: this.conventionalPathsInSource[j],
					};
				}
			}
		}

		return {};
	}

	/**
	 * Attempts to find the current timezone.
	 *
	 * @returns {import('@cloudcannon/configuration-types').Timezone | undefined}
	 */
	getTimezone() {
		const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
		return /** @type {import('@cloudcannon/configuration-types').Timezone | undefined} */ (
			timezone
		);
	}

	/**
	 * @returns {string[]}
	 */
	configPaths() {
		return [];
	}

	/**
	 * Returns a prioritised list of config file paths from the provided set.
	 *
	 * @param configFilePaths {string[]} List of config files.
	 * @returns {string[]}
	 */
	sortConfigFilePaths(configFilePaths) {
		const configPaths = this.configPaths();
		return configFilePaths.sort((a, b) => configPaths.indexOf(a) - configPaths.indexOf(b));
	}

	/**
	 * Returns the parsed contents of the first readable configuration file provided.
	 *
	 * @param configFilePaths {string[]} List of config files.
	 * @param readFile {(path: string) => Promise<string | undefined>} Function to read files.
	 * @returns {Promise<Record<string, any> | undefined>}
	 */
	async parseConfig(configFilePaths, readFile) {
		const sorted = this.sortConfigFilePaths(configFilePaths);
		for (const configFilePath of sorted) {
			try {
				const config = await parseDataFile(configFilePath, readFile);
				if (config) {
					return config;
				}
			} catch (_e) {
				// Intentionally ignored
			}
		}
	}

	/**
	 * @returns {string[]}
	 */
	templateExtensions() {
		return ['.htm', '.html'];
	}

	/**
	 * @returns {string[]}
	 */
	contentExtensions() {
		return [
			'.md',
			'.mdown',
			'.markdown',
			'.mdx',
			'.json',
			'.yml',
			'.yaml',
			'.toml',
			'.csv',
			'.tsv',
		];
	}

	/**
	 * @returns {string[]}
	 */
	partialFolders() {
		return [
			'layouts/', // general partials
			'components/', // general partials
			'component-library/', // general partials
			'schemas/', // CloudCannon schema files
		];
	}

	/**
	 * @returns {string[]}
	 */
	ignoredFolders() {
		return [
			'.git/',
			'.github/',
			'.cloudcannon/',
			'_cloudcannon/',
			'node_modules/',
			'.vscode/',
			'.zed/',
		];
	}

	/**
	 * @returns {string[]}
	 */
	ignoredFiles() {
		return [
			'.DS_Store',
			'.eslintrc.json',
			'tsconfig.json',
			'jsconfig.json',
			'.prettierrc.json',
			'docker-compose.yaml',
			'docker-compose.yml',
			'docker-compose.nginx.yaml',
			'docker-compose.nginx.yml',
			'package-lock.json',
			'package.json',
			'netlify.toml',
			'vercel.json',
			'manifest.json',
			'.gitignore',
			'README.md',
			'CODE_OF_CONDUCT.md',
			'CONTRIBUTING.md',
			'LICENSE.md',
			'CHANGELOG.md',
			'HISTORY.md',
			'cloudcannon.config.cjs',
			'cloudcannon.config.js',
			'cloudcannon.config.json',
			'cloudcannon.config.yml',
			'cloudcannon.config.yaml',
		];
	}

	/**
	 * Checks if the file at this path is an SSG configuration file.
	 *
	 * @param filePath {string}
	 * @returns {boolean}
	 */
	isConfigPath(filePath) {
		return this.configPaths().some(
			(configPath) => filePath === configPath || filePath.endsWith(`/${configPath}`),
		);
	}

	/**
	 * Returns a score for how likely a file path relates to this SSG.
	 *
	 * @param filePath {string}
	 * @returns {number}
	 */
	getPathScore(filePath) {
		return this.isConfigPath(filePath) ? 1 : 0;
	}

	/**
	 * Checks if we should skip a file at this path
	 *
	 * @param filePath {string}
	 * @returns {boolean}
	 */
	isIgnoredPath(filePath) {
		return (
			filePath.includes('.config.') ||
			filePath.includes('/.') ||
			filePath.startsWith('.') ||
			this.ignoredFolders().some(
				(folder) => filePath.startsWith(folder) || filePath.includes(`/${folder}`),
			) ||
			this.ignoredFiles().some((file) => filePath === file || filePath.endsWith(`/${file}`))
		);
	}

	/**
	 * Checks if the file at this path is a contains Markdown or structured content.
	 *
	 * @param filePath {string}
	 * @returns {boolean}
	 */
	isContentPath(filePath) {
		return this.contentExtensions().includes(extname(filePath));
	}

	/**
	 * Checks if the file at this path is an include, partial or layout file.
	 *
	 * @param filePath {string}
	 * @returns {boolean}
	 */
	isPartialPath(filePath) {
		return this.partialFolders().some(
			(partialFolder) =>
				filePath === partialFolder ||
				filePath.includes(`/${partialFolder}`) ||
				filePath.startsWith(partialFolder),
		);
	}

	/**
	 * Checks if the file at this path is a template file.
	 *
	 * @param filePath {string}
	 * @returns boolean
	 */
	isTemplatePath(filePath) {
		return this.templateExtensions().includes(extname(filePath));
	}

	/**
	 * Finds the likely type of the file at this path.
	 *
	 * @param filePath {string}
	 * @returns {import('../types').FileType}
	 */
	getFileType(filePath) {
		if (this.isConfigPath(filePath)) {
			return 'config';
		}

		if (this.isIgnoredPath(filePath)) {
			return 'ignored';
		}

		if (this.isPartialPath(filePath)) {
			return 'partial';
		}

		if (this.isContentPath(filePath)) {
			return 'content';
		}

		if (this.isTemplatePath(filePath)) {
			return 'template';
		}

		return 'other';
	}

	/**
	 * Attempts to find the most likely source folder.
	 *
	 * @param filePaths {string[]} List of input file paths.
	 * @returns {string | undefined}
	 */
	getSource(filePaths) {
		const { filePath, conventionPath } = this.findConventionPath(filePaths);

		if (filePath && conventionPath) {
			const conventionIndex = filePath.indexOf(conventionPath);
			return filePath.substring(0, Math.max(0, conventionIndex - 1)) || undefined;
		}
	}

	/**
	 * Generates a collection config entry.
	 *
	 * @param key {string}
	 * @param path {string}
	 * @param _options {{ basePath?: string; }=}
	 * @returns {import('@cloudcannon/configuration-types').CollectionConfig}
	 */
	generateCollectionConfig(key, path, _options) {
		const name = titleize(basename(key).replace(/[_-]/g, ' ').trim());

		return {
			path,
			name,
			icon: findIcon(name.toLowerCase()),
			output: true,
		};
	}

	/**
	 * Generates a collections config key from a path, avoiding existing keys.
	 *
	 * @param path {string}
	 * @param collectionsConfig {Record<string, any>}
	 * @returns {string}
	 */
	generateCollectionsConfigKey(path, collectionsConfig) {
		let key = slugify(path, { separator: '_' }) || 'pages';
		let suffix = 1;

		while (Object.prototype.hasOwnProperty.call(collectionsConfig, key)) {
			key = `${key.replace(/_\d+$/, '')}_${suffix++}`;
		}

		return key;
	}

	/**
	 * Generates collections config from a set of paths.
	 *
	 * @param collectionPaths {string[]}
	 * @param options {{ config?: Record<string, any>; source?: string; basePath: string; }}
	 * @returns {import('../types').CollectionsConfig}
	 */
	generateCollectionsConfig(collectionPaths, options) {
		/** @type {import('../types').CollectionsConfig} */
		const collectionsConfig = {};
		const basePath = options.source
			? stripTopPath(options.basePath, options.source)
			: options.basePath;

		const sortedPaths = collectionPaths.sort((a, b) => a.length - b.length);
		/** @type {string[]} */
		const seenPaths = [];

		for (const fullPath of sortedPaths) {
			const path = stripTopPath(fullPath, options.source);

			if (seenPaths.some((seenPath) => path.startsWith(seenPath))) {
				// Skip collection if parent path seen before
				continue;
			} else if (path) {
				// add to seen paths if not the root folder
				seenPaths.push(path + '/');
			}

			const key = this.generateCollectionsConfigKey(path, collectionsConfig);
			collectionsConfig[key] = this.generateCollectionConfig(key, path, { basePath });
		}

		return collectionsConfig;
	}

	/**
	 * @param _config {Record<string, any> | undefined}
	 * @returns {import('@cloudcannon/configuration-types').MarkdownSettings}
	 */
	generateMarkdown(_config) {
		return {
			engine: 'commonmark',
			options: {},
		};
	}

	/**
	 * Generates a list of build suggestions.
	 *
	 * @param filePaths {string[]} List of input file paths.
	 * @param options {{ config?: Record<string, any>; source?: string; readFile?: (path: string) => Promise<string | undefined>; }}
	 * @returns {Promise<import('../types').BuildCommands>}
	 */
	async generateBuildCommands(filePaths, options) {
		/** @type {import('../types').BuildCommands} */
		const commands = {
			install: [],
			build: [],
			output: [],
			preserved: [],
			environment: {},
		};

		const packageJsonPath = joinPaths([options.source, 'package.json']);
		if (filePaths.includes(packageJsonPath)) {
			commands.install.push({
				value: 'npm i',
				attribution: 'because of your `package.json` file',
			});

			commands.preserved.push({
				value: 'node_modules/',
				attribution: 'because of your `package.json` file',
			});

			try {
				const raw = options.readFile ? await options.readFile(packageJsonPath) : undefined;
				const parsed = raw ? JSON.parse(raw) : undefined;

				if (parsed?.scripts?.build) {
					commands.build.push({
						value: 'npm run build',
						attribution: 'found in your `package.json` file',
					});
				}
			} catch (_e) {}
		}

		return commands;
	}
}
