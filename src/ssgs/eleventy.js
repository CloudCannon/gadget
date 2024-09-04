import { joinPaths, stripBottomPath } from '../utility.js';
import Ssg from './ssg.js';

export default class Eleventy extends Ssg {
	constructor() {
		super('eleventy');
	}

	configPaths() {
		return super
			.configPaths()
			.concat([
				'eleventy.config.js',
				'eleventy.config.mjs',
				'eleventy.config.cjs',
				'.eleventy.mjs',
				'.eleventy.cjs',
				'.eleventy.js',
			]);
	}

	templateExtensions() {
		return super
			.templateExtensions()
			.concat(['.njk', '.liquid', '.hbs', '.ejs', '.webc', '.mustache', '.haml', '.pug']);
	}

	contentExtensions() {
		return super.contentExtensions().concat(['.html']);
	}

	partialFolders() {
		return super.partialFolders().concat(['_includes/']);
	}

	ignoredFolders() {
		return super.ignoredFolders().concat([
			'_site/', // build output
		]);
	}

	conventionalPathsInSource = ['_includes/', '_data/'];

	/**
	 * Attempts to find the most likely source folder.
	 *
	 * @param filePaths {string[]} List of input file paths.
	 * @returns {string | undefined}
	 */
	getSource(filePaths) {
		const source = super.getSource(filePaths);
		if (source !== undefined) {
			return source;
		}

		const configFilePath = filePaths.find(this.isConfigPath.bind(this));
		if (configFilePath) {
			return stripBottomPath(configFilePath) || undefined;
		}
	}

	/**
	 * Generates a collection config entry.
	 *
	 * @param key {string}
	 * @param path {string}
	 * @param options {{ config?: Record<string, any>; basePath?: string; }=}
	 * @returns {import('@cloudcannon/configuration-types').CollectionConfig}
	 */
	generateCollectionConfig(key, path, options) {
		const collectionConfig = super.generateCollectionConfig(key, path, options);
		collectionConfig.output = !(path === '_data' || path.endsWith('/_data'));
		return collectionConfig;
	}

	/**
	 * Filters out collection paths that are collections, but exist in isolated locations.
	 * Used when a data folder (or similar) is causing all collections to group under one
	 * `collections_config` entry.
	 *
	 * @param collectionPaths {string[]}
	 * @param options {{ config?: Record<string, any>; source?: string; basePath: string; }}
	 * @returns {string[]}
	 */
	filterContentCollectionPaths(collectionPaths, options) {
		const dataPath = joinPaths([options.basePath, '_data']);
		return collectionPaths.filter((path) => path !== dataPath && !path.startsWith(`${dataPath}/`));
	}

	/**
	 * @param _config {Record<string, any>}
	 * @returns {import('@cloudcannon/configuration-types').MarkdownSettings}
	 */
	generateMarkdown(_config) {
		return {
			engine: 'commonmark',
			options: {
				html: true,
			},
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
		const commands = await super.generateBuildCommands(filePaths, options);

		commands.build.unshift({
			value: 'npx @11ty/eleventy',
			attribution: 'most common for 11ty sites',
		});
		commands.output.unshift({
			value: '_site',
			attribution: 'most common for 11ty sites',
		});

		return commands;
	}
}
