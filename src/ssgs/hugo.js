import { decodeEntity } from '../utility.js';
import Ssg from './ssg.js';

export default class Hugo extends Ssg {
	constructor() {
		super('hugo');
	}

	configPaths() {
		return super
			.configPaths()
			.concat(['hugo.toml', 'hugo.yaml', 'hugo.json', 'config.toml', 'config.yaml', 'config.json']);
	}

	templateExtensions() {
		return [];
	}

	partialFolders() {
		return super.partialFolders().concat([
			'archetypes/', // scaffolding templates
		]);
	}

	ignoredFolders() {
		return super.ignoredFolders().concat([
			'resources/', // cache
		]);
	}

	/**
	 * Generates a collection config entry.
	 *
	 * @param key {string}
	 * @param path {string}
	 * @param options {{ basePath: string; }=}
	 * @returns {import('@cloudcannon/configuration-types').CollectionConfig}
	 */
	generateCollectionConfig(key, path, options) {
		const collectionConfig = super.generateCollectionConfig(key, path, options);

		if (path !== options?.basePath) {
			collectionConfig.glob =
				typeof collectionConfig.glob === 'string'
					? [collectionConfig.glob]
					: collectionConfig.glob || [];
			collectionConfig.glob.push('!_index.md');
		}

		return collectionConfig;
	}

	/**
	 * @param config {Record<string, any> | undefined}
	 * @returns {import('@cloudcannon/configuration-types').MarkdownSettings}
	 */
	generateMarkdown(config) {
		const goldmark = config?.markup?.goldmark || {};
		const { extensions, parser, renderer } = goldmark;
		const extras = extensions?.extras || {};

		/** @type {import('@cloudcannon/configuration-types').MarkdownSettings['options']} */
		const options = {
			gfm: true,
		};

		// https://gohugo.io/getting-started/configuration-markup/#goldmark
		options.linkify = !!extensions?.linkify;
		options.table = !!extensions?.table;
		options.strikethrough = !!extensions?.strikethrough || !!extras?.delete?.enable;
		options.subscript = !!extras?.subscript?.enable;
		options.superscript = !!extras?.superscript?.enable;
		options.heading_ids = !!parser?.autoHeadingID;
		options.breaks = !!renderer?.hardWraps;
		options.xhtml = !!renderer?.xhtml;
		options.attributes = !!parser?.attribute?.block || !!parser?.attribute?.title;
		options.typographer = !!extensions?.typographer && !extensions.typographer.disable;
		if (options.typographer) {
			const { leftDoubleQuote, leftSingleQuote, rightDoubleQuote, rightSingleQuote } =
				extensions.typographer;
			if (leftDoubleQuote && leftSingleQuote && rightDoubleQuote && rightSingleQuote) {
				options.quotes = [leftSingleQuote, rightSingleQuote, leftDoubleQuote, rightDoubleQuote]
					.map(decodeEntity)
					.join('');
			}
		}

		options.treat_indentation_as_code = true;

		return {
			engine: 'commonmark',
			options,
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

		commands.build.unshift('hugo');
		commands.output.unshift('public');

		return commands;
	}
}
