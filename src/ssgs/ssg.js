import { extname } from 'path';
import { basename } from 'path';
import slugify from '@sindresorhus/slugify';
import titleize from 'titleize';
import { findIcon } from '../icons.js';
import { last, parseDataFile, stripTopPath } from '../utility.js';
import { findBasePath, getCollectionPaths } from '../collections.js';

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
		const configPaths = this.configPaths();

		for (let i = 0; i < configPaths.length; i++) {
			if (filePath === configPaths[i] || filePath.endsWith(`/${configPaths[i]}`)) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Returns a score for how likely a file path relates to this SSG.
	 *
	 * @param filePath {string}
	 * @returns {number}
	 */
	getPathScore(filePath) {
		if (this.isInIgnoredFolder(filePath)) {
			return 0;
		}

		return this.isConfigPath(filePath) ? 1 : 0;
	}

	/**
	 * Checks if a file at this path in inside an ignored folder.
	 *
	 * @param filePath {string}
	 * @returns {boolean}
	 */
	isInIgnoredFolder(filePath) {
		const ignoredFolders = this.ignoredFolders();

		for (let i = 0; i < ignoredFolders.length; i++) {
			if (filePath.startsWith(ignoredFolders[i]) || filePath.includes(`/${ignoredFolders[i]}`)) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Checks if a file at this path is ignored.
	 *
	 * @param filePath {string}
	 * @returns {boolean}
	 */
	isIgnoredFile(filePath) {
		const ignoredFiles = this.ignoredFiles();

		for (let i = 0; i < ignoredFiles.length; i++) {
			if (filePath === ignoredFiles[i] || filePath.endsWith(`/${ignoredFiles[i]}`)) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Checks if we should skip a file at this path.
	 *
	 * @param filePath {string}
	 * @returns {boolean}
	 */
	isIgnoredPath(filePath) {
		return (
			filePath.includes('.config.') ||
			filePath.includes('/.') ||
			filePath.startsWith('.') ||
			this.isInIgnoredFolder(filePath) ||
			this.isIgnoredFile(filePath)
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
		const partialFolders = this.partialFolders();

		for (let i = 0; i < partialFolders.length; i++) {
			if (
				filePath === partialFolders[i] ||
				filePath.includes(`/${partialFolders[i]}`) ||
				filePath.startsWith(partialFolders[i])
			) {
				return true;
			}
		}

		return false;
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
	 * @param _options {import('../types').GenerateCollectionConfigOptions}
	 * @returns {import('@cloudcannon/configuration-types').CollectionConfig}
	 */
	generateCollectionConfig(key, path, _options) {
		const name = titleize(basename(key).replace(/[_-]/g, ' ').trim());

		return {
			path,
			name,
			icon: findIcon(key),
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
	 * Filters out collection paths that are collections, but exist in isolated locations.
	 * Used when a data folder (or similar) is causing all collections to group under one
	 * `collections_config` entry.
	 *
	 * @param collectionPaths {string[]}
	 * @param _options {import('../types').GenerateCollectionsConfigOptions}
	 * @returns {string[]}
	 */
	filterContentCollectionPaths(collectionPaths, _options) {
		return collectionPaths;
	}

	/**
	 * Generates collections config from a set of paths.
	 *
	 * @param collectionPaths {string[]}
	 * @param options {import('../types').GenerateCollectionsConfigOptions}
	 * @returns {import('../types').CollectionsConfig}
	 */
	generateCollectionsConfig(collectionPaths, options) {
		const contentCollectionPaths = this.filterContentCollectionPaths(collectionPaths, options);

		const hasNonContentCollection =
			collectionPaths.length && collectionPaths.length !== contentCollectionPaths.length;

		const basePath = stripTopPath(
			hasNonContentCollection ? findBasePath(contentCollectionPaths) : options.basePath,
			options.source,
		);

		const sortedPaths = collectionPaths.sort((a, b) => a.length - b.length);
		const seenPaths = /** @type {string[]} */ ([]);
		const collectionsConfig = /** @type {import('../types').CollectionsConfig} */ ({});

		for (const fullPath of sortedPaths) {
			const path = stripTopPath(fullPath, options.source);
			const pathInBasePath = stripTopPath(path, basePath);

			if (seenPaths.some((seenPath) => pathInBasePath.startsWith(seenPath))) {
				// Skip collection if higher level path seen before
				continue;
			} else if (pathInBasePath) {
				seenPaths.push(pathInBasePath + '/');
			}

			const key = this.generateCollectionsConfigKey(pathInBasePath, collectionsConfig);
			collectionsConfig[key] = this.generateCollectionConfig(key, path, {
				...options,
				collectionPaths,
				basePath,
			});
		}

		return collectionsConfig;
	}

	/**
	 * Generates collections config from a set of paths.
	 *
	 * @param collectionsConfig {import('../types').CollectionsConfig}
	 * @returns {import('../types').CollectionsConfig}
	 */
	sortCollectionsConfig(collectionsConfig) {
		/** @type {import('../types').CollectionsConfig} */
		const sorted = {};

		const sortedKeys = Object.keys(collectionsConfig).sort((a, b) => {
			const aCollectionConfig = collectionsConfig[a];
			const bCollectionConfig = collectionsConfig[b];

			if (
				a === 'pages' ||
				aCollectionConfig.path === '' ||
				(!aCollectionConfig.disable_url && bCollectionConfig.disable_url)
			) {
				return -1;
			}

			if (
				b === 'pages' ||
				bCollectionConfig.path === '' ||
				(!bCollectionConfig.disable_url && aCollectionConfig.disable_url)
			) {
				return 1;
			}

			return a.localeCompare(b);
		});

		for (const key of sortedKeys) {
			sorted[key] = collectionsConfig[key];
		}

		return sorted;
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

		if (filePaths.includes('package.json')) {
			const useYarn = filePaths.includes('yarn.lock');
			const usePnpm = filePaths.includes('pnpm-lock.yaml');
			const useNpm = filePaths.includes('package-lock.json') || (!useYarn && !usePnpm);

			if (useNpm) {
				commands.install.push({
					value: 'npm i',
					attribution: 'because of your `package.json` file',
				});
			}
			if (useYarn) {
				commands.install.push({
					value: 'yarn',
					attribution: 'because of your `yarn.lock` file',
				});
			}
			if (usePnpm) {
				commands.install.push({
					value: 'pnpm i',
					attribution: 'because of your `pnpm-lock.yaml` file',
				});
			}

			commands.preserved.push({
				value: 'node_modules/',
				attribution: 'because of your `package.json` file',
			});

			try {
				if (options.readFile) {
					const parsed = await parseDataFile('package.json', options.readFile);
					if (parsed?.scripts?.build) {
						if (useNpm) {
							commands.build.push({
								value: 'npm run build',
								attribution: 'found in your `package.json` file',
							});
						}
						if (useYarn) {
							commands.build.push({
								value: 'yarn build',
								attribution: 'found in your `package.json` file',
							});
						}
						if (usePnpm) {
							commands.build.push({
								value: 'pnpm build',
								attribution: 'found in your `package.json` file',
							});
						}
					}
				}
			} catch (_e) {}
		}

		/**
		 * Check a value from a settings file and add to build commands.
		 *
		 * @param value {unknown}
		 * @param filename {string}
		 * @param type {keyof import('../types').BuildCommands}
		 */
		const validateAndAddCommandFromSettings = (value, filename, type) => {
			if (value && typeof value === 'string') {
				if (type === 'environment') {
					commands[type].value = {
						value,
						attribution: `found in your \`${filename}\` file`,
					};
				} else {
					commands[type].push({
						value,
						attribution: `found in your \`${filename}\` file`,
					});
				}
			}
		};

		if (options.readFile) {
			const forestrySettingsPath = '.forestry/settings.yml';
			if (filePaths.includes(forestrySettingsPath)) {
				try {
					const parsed = await parseDataFile(forestrySettingsPath, options.readFile);
					validateAndAddCommandFromSettings(
						parsed?.build?.install_dependencies_command,
						forestrySettingsPath,
						'install',
					);
				} catch (_e) {}
			}

			const netlifySettingsPath = 'netlify.toml';
			if (filePaths.includes(netlifySettingsPath)) {
				// https://docs.netlify.com/configure-builds/file-based-configuration/
				try {
					const parsed = await parseDataFile(netlifySettingsPath, options.readFile);
					validateAndAddCommandFromSettings(parsed?.build?.command, netlifySettingsPath, 'build');
					validateAndAddCommandFromSettings(parsed?.build?.publish, netlifySettingsPath, 'output');
				} catch (_e) {}
			}

			const vercelSettingsPath = 'vercel.json';
			if (filePaths.includes(vercelSettingsPath)) {
				// https://vercel.com/docs/projects/project-configuration
				try {
					const parsed = await parseDataFile(vercelSettingsPath, options.readFile);
					validateAndAddCommandFromSettings(parsed?.installCommand, vercelSettingsPath, 'install');
					validateAndAddCommandFromSettings(parsed?.buildCommand, vercelSettingsPath, 'build');
					validateAndAddCommandFromSettings(parsed?.outputDirectory, vercelSettingsPath, 'output');
				} catch (_e) {}
			}
		}

		return commands;
	}

	/**
	 * Generates path configuration
	 *
	 * @returns {import('@cloudcannon/configuration-types').Paths | undefined}
	 */
	getPaths() {
		return {
			static: '',
			uploads: 'uploads',
		};
	}

	/**
	 * Generates path configuration
	 *
	 * @returns {import('@cloudcannon/configuration-types').SnippetsImports | undefined}
	 */
	getSnippetsImports() {
		return;
	}
}
