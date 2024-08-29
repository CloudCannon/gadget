import { findBasePath } from '../collections.js';
import { decodeEntity, stripTopPath } from '../utility.js';
import Ssg from './ssg.js';

export default class Hugo extends Ssg {
	constructor() {
		super('hugo');
	}

	configPaths() {
		return super.configPaths().concat([
			'hugo.toml',
			'hugo.yml',
			'hugo.yaml',
			'hugo.json',
			'theme.toml', // on theme repos
			'config.toml',
			'config.yml',
			'config.yaml',
			'config.json',
		]);
	}

	templateExtensions() {
		return [];
	}

	partialFolders() {
		return super.partialFolders().concat([
			'archetypes/', // scaffolding templates
		]);
	}

	ignoredFiles() {
		return super.ignoredFiles().concat([
			'theme.toml', // config file for a hugo theme repo
		]);
	}

	ignoredFolders() {
		return super.ignoredFolders().concat([
			'assets/', // unprocessed asset folder
			'public/', // default output
			'resources/', // cache
		]);
	}

	// These are customisable, but likely fine to use for source detection regardless.
	conventionalPathsInSource = [
		'archetypes/',
		'assets/',
		'content/',
		'config/',
		'data/',
		'i18n/',
		'layouts/',
		'static/',
		'themes/',
	];

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
	 * Generates collections config from a set of paths.
	 *
	 * @param collectionPaths {string[]}
	 * @param options {{ config?: Record<string, any>; source?: string; basePath: string; }}
	 * @returns {import('../types').CollectionsConfig}
	 */
	generateCollectionsConfig(collectionPaths, options) {
		/** @type {import('../types').CollectionsConfig} */
		const collectionsConfig = {};
		let basePath = options.basePath;

		const collectionPathsOutsideExampleSite = collectionPaths.filter(
			(path) => !path.includes('exampleSite/'),
		);

		const hasNonExampleSiteCollections =
			collectionPathsOutsideExampleSite.length &&
			collectionPathsOutsideExampleSite.length !== collectionPaths.length;

		if (hasNonExampleSiteCollections) {
			basePath = findBasePath(collectionPathsOutsideExampleSite);
			collectionPaths = collectionPathsOutsideExampleSite;
		}

		const reducedCollectionPaths = collectionPaths.filter((path) => {
			const pathInBasePath = stripTopPath(path, basePath);
			return pathInBasePath.split('/').length < 2;
		});

		basePath = stripTopPath(basePath, options.source);

		for (const fullPath of reducedCollectionPaths) {
			const path = stripTopPath(fullPath, options.source);
			const pathInBasePath = stripTopPath(path, basePath);
			const key = this.generateCollectionsConfigKey(pathInBasePath, collectionsConfig);

			collectionsConfig[key] = this.generateCollectionConfig(key, path, { basePath });
		}

		return collectionsConfig;
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

		commands.build.unshift({
			value: 'hugo',
			attribution: 'most common for Hugo sites',
		});
		commands.output.unshift({
			value: 'public',
			attribution: 'most common for Hugo sites',
		});

		commands.environment['HUGO_CACHEDIR'] = {
			value: '/usr/local/__site/src/.hugo_cache/',
			attribution: 'recommended for Hugo sites',
		};

		commands.preserved.push({
			value: '.hugo_cache/,resources/',
			attribution: 'recommended for speeding up Hugo builds',
		});

		return commands;
	}
}
