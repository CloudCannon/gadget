import { extname } from 'node:path';
import { basename } from 'node:path';
import type {
	CollectionConfig,
	MarkdownSettings,
	Paths,
	SnippetsImports,
	SsgKey,
	Timezone,
} from '@cloudcannon/configuration-types';
import slugify from '@sindresorhus/slugify';
import titleize from 'titleize';
import { findBasePath, getCollectionPaths } from '../collections';
import { findIcon } from '../icons';
import { last, parseDataFile, stripTopPath } from '../utility';

export type FileType = 'config' | 'content' | 'template' | 'partial' | 'ignored' | 'other';

export interface FileSummary {
	filePath: string;
	type: FileType;
	collectionPaths?: string[];
}

export interface GroupedFileSummaries {
	groups: Record<FileType, FileSummary[]>;
	collectionPathCounts: Record<string, number>;
}

export interface GenerateCollectionsConfigOptions {
	config?: Record<string, any>;
	source?: string;
	basePath: string;
	filePaths: string[];
}

export interface GenerateBuildCommandsOptions {
	config?: Record<string, any>;
	source?: string;
	readFile?: (path: string) => Promise<string | undefined>;
}

export interface GenerateCollectionConfigOptions extends GenerateCollectionsConfigOptions {
	collectionPaths: string[];
}

export interface BuildCommandSuggestion {
	value: string;
	/** Describes why this build suggestion was made */
	attribution: string;
}

export interface BuildCommands {
	install: BuildCommandSuggestion[];
	build: BuildCommandSuggestion[];
	output: BuildCommandSuggestion[];
	environment: Record<string, BuildCommandSuggestion>;
	preserved: BuildCommandSuggestion[];
}

export default class Ssg {
	key: SsgKey;

	constructor(key?: SsgKey) {
		this.key = key || 'other';
	}

	/**
	 * Provides a summary of files.
	 */
	groupFiles(filePaths: string[]): GroupedFileSummaries {
		const collectionPathCounts: Record<string, number> = {};

		const groups: Record<FileType, FileSummary[]> = {
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

	conventionalPathsInSource: string[] = [];

	/**
	 * Attempts to find the most likely source folder for a Jekyll site.
	 */
	findConventionPath(filePaths: string[]): { filePath?: string; conventionPath?: string } {
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
	 */
	getTimezone(): Timezone | undefined {
		const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
		return timezone as Timezone;
	}

	configPaths(): string[] {
		return [];
	}

	/**
	 * Returns a prioritised list of config file paths from the provided set.
	 */
	sortConfigFilePaths(configFilePaths: string[]): string[] {
		const configPaths = this.configPaths();
		return configFilePaths.sort((a, b) => configPaths.indexOf(a) - configPaths.indexOf(b));
	}

	/**
	 * Returns the parsed contents of the first readable configuration file provided.
	 */
	async parseConfig(
		configFilePaths: string[],
		readFile: (path: string) => Promise<string | undefined>
	): Promise<Record<string, any> | undefined> {
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

	templateExtensions(): string[] {
		return ['.htm', '.html'];
	}

	contentExtensions(): string[] {
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

	partialFolders(): string[] {
		return [
			'layouts/', // general partials
			'components/', // general partials
			'component-library/', // general partials
			'schemas/', // CloudCannon schema files
		];
	}

	ignoredFolders(): string[] {
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

	ignoredFiles(): string[] {
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
	 */
	isConfigPath(filePath: string): boolean {
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
	 */
	getPathScore(filePath: string): number {
		if (this.isInIgnoredFolder(filePath)) {
			return 0;
		}

		return this.isConfigPath(filePath) ? 1 : 0;
	}

	/**
	 * Checks if a file at this path in inside an ignored folder.
	 */
	isInIgnoredFolder(filePath: string): boolean {
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
	 */
	isIgnoredFile(filePath: string): boolean {
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
	 */
	isIgnoredPath(filePath: string): boolean {
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
	 */
	isContentPath(filePath: string): boolean {
		return this.contentExtensions().includes(extname(filePath));
	}

	/**
	 * Checks if the file at this path is an include, partial or layout file.
	 */
	isPartialPath(filePath: string): boolean {
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
	 */
	isTemplatePath(filePath: string): boolean {
		return this.templateExtensions().includes(extname(filePath));
	}

	/**
	 * Finds the likely type of the file at this path.
	 */
	getFileType(filePath: string): FileType {
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
	 */
	getSource(filePaths: string[]): string | undefined {
		const { filePath, conventionPath } = this.findConventionPath(filePaths);

		if (filePath && conventionPath) {
			const conventionIndex = filePath.indexOf(conventionPath);
			return filePath.substring(0, Math.max(0, conventionIndex - 1)) || undefined;
		}
	}

	/**
	 * Generates a collection config entry.
	 */
	generateCollectionConfig(
		key: string,
		path: string,
		_options: GenerateCollectionConfigOptions
	): CollectionConfig {
		const name = titleize(basename(key).replace(/[_-]/g, ' ').trim());

		return {
			path,
			name,
			icon: findIcon(key),
		};
	}

	/**
	 * Generates a collections config key from a path, avoiding existing keys.
	 */
	generateCollectionsConfigKey(
		path: string,
		collectionsConfig: Record<string, CollectionConfig>
	): string {
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
	 */
	filterContentCollectionPaths(
		collectionPaths: string[],
		_options: GenerateCollectionsConfigOptions
	): string[] {
		return collectionPaths;
	}

	/**
	 * Generates collections config from a set of paths.
	 */
	generateCollectionsConfig(
		collectionPaths: string[],
		options: GenerateCollectionsConfigOptions
	): Record<string, CollectionConfig> {
		const contentCollectionPaths = this.filterContentCollectionPaths(collectionPaths, options);

		const hasNonContentCollection =
			collectionPaths.length && collectionPaths.length !== contentCollectionPaths.length;

		const basePath = stripTopPath(
			hasNonContentCollection ? findBasePath(contentCollectionPaths) : options.basePath,
			options.source
		);

		const sortedPaths = collectionPaths.sort((a, b) => a.length - b.length);
		const seenPaths: string[] = [];
		const collectionsConfig: Record<string, CollectionConfig> = {};

		for (const fullPath of sortedPaths) {
			const path = stripTopPath(fullPath, options.source);
			const pathInBasePath = stripTopPath(path, basePath);

			if (seenPaths.some((seenPath) => pathInBasePath.startsWith(seenPath))) {
				// Skip collection if higher level path seen before
				continue;
			}
			if (pathInBasePath) {
				seenPaths.push(`${pathInBasePath}/`);
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
	 * Sorts a collections config.
	 */
	sortCollectionsConfig(
		collectionsConfig: Record<string, CollectionConfig>
	): Record<string, CollectionConfig> {
		const sorted: Record<string, CollectionConfig> = {};

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

	generateMarkdown(_config: Record<string, any> | undefined): MarkdownSettings {
		return {
			engine: 'commonmark',
			options: {},
		};
	}

	/**
	 * Generates a list of build suggestions.
	 */
	async generateBuildCommands(
		filePaths: string[],
		options: GenerateBuildCommandsOptions
	): Promise<BuildCommands> {
		const commands: BuildCommands = {
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
		 */
		const validateAndAddCommandFromSettings = (
			value: unknown,
			filename: string,
			type: keyof BuildCommands
		): void => {
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
						'install'
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
	 * Generates path configuration.
	 */
	getPaths(): Paths | undefined {
		return {
			static: '',
			uploads: 'uploads',
		};
	}

	getSnippetsImports(): SnippetsImports | undefined {
		return;
	}
}
