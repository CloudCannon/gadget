import Ssg from './ssg.js';

export default class Astro extends Ssg {
	constructor() {
		super('astro');
	}

	/** @type {string[]} */
	conventionalPathsInSource = ['src/', 'public/'];

	/**
	 * @returns {string[]}
	 */
	configPaths() {
		return ['astro.config.mjs', 'astro.config.cjs', 'astro.config.js', 'astro.config.ts'];
	}

	ignoredFolders() {
		return super.ignoredFolders().concat([
			'public/', // passthrough asset folder
			'dist/', // default output
			'.astro', // generated types
		]);
	}

	templateExtensions() {
		return super.templateExtensions().concat(['.astro', '.tsx', '.jsx', '.vue', '.svelte']);
	}

	/**
	 * Filters out collection paths that are collections, but exist in isolated locations.
	 * Used when a data folder (or similar) is causing all collections to group under one
	 * `collections_config` entry.
	 *
	 * @param collectionPaths {string[]}
	 * @param _options {{ config?: Record<string, any>; source?: string; basePath: string; }}
	 * @returns {string[]}
	 */
	filterContentCollectionPaths(collectionPaths, _options) {
		return collectionPaths.filter(
			(path) => path.startsWith('src/content') || path.startsWith('src/pages'),
		);
	}

	/**
	 * Generates a collections config key from a path, avoiding existing keys.
	 *
	 * @param path {string}
	 * @param collectionsConfig {Record<string, any>}
	 * @returns {string}
	 */
	generateCollectionsConfigKey(path, collectionsConfig) {
		const key = super.generateCollectionsConfigKey(path, collectionsConfig);

		if (key.startsWith('content_')) {
			const trimmedKey = key.replace('content_', '');
			if (!Object.prototype.hasOwnProperty.call(collectionsConfig, trimmedKey)) {
				return trimmedKey;
			}
		}

		return key;
	}

	/**
	 * Generates a collection config entry.
	 *
	 * @param key {string}
	 * @param path {string}
	 * @param options {import('../types').GenerateCollectionConfigOptions}
	 * @returns {import('@cloudcannon/configuration-types').CollectionConfig}
	 */
	generateCollectionConfig(key, path, options) {
		const collectionConfig = super.generateCollectionConfig(key, path, options);

		if (
			!collectionConfig.path?.startsWith('src/pages') &&
			!collectionConfig.path?.startsWith('src/content')
		) {
			collectionConfig.disable_url = true;
		}

		return collectionConfig;
	}

	/**
	 * Generates a list of build suggestions.
	 *
	 * @param filePaths {string[]} List of input file paths.
	 * @param options {{ config?: Record<string, any>; source?: string; readFile?: (path: string) => Promise<string | undefined>; }}
	 * @returns {Promise<import('../types').BuildCommands>}
	 */
	async generateBuildCommands(filePaths, options) {
		const commands = await super.generateBuildCommands(filePaths, options);

		commands.build.push({
			value: 'npx astro build',
			attribution: 'most common for Astro sites',
		});
		commands.output.push({
			value: 'dist',
			attribution: 'most common for Astro sites',
		});

		return commands;
	}

	/**
	 * Generates path configuration
	 *
	 * @returns {import('@cloudcannon/configuration-types').Paths | undefined}
	 */
	getPaths() {
		return {
			...super.getPaths(),
			static: 'public',
			uploads: 'public/uploads',
		};
	}

	/**
	 * @param _config {Record<string, any> | undefined}
	 * @returns {import('@cloudcannon/configuration-types').MarkdownSettings}
	 */
	generateMarkdown(_config) {
		return {
			engine: 'commonmark',
			options: {
				gfm: true,
			},
		};
	}
}
