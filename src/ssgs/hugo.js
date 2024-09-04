import { findBasePath } from '../collections.js';
import { decodeEntity, joinPaths, normalisePath } from '../utility.js';
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
			'static/', // passthrough asset folder
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
	 * @param options {{ config?: Record<string, any>; basePath: string; }}
	 * @returns {import('@cloudcannon/configuration-types').CollectionConfig}
	 */
	generateCollectionConfig(key, path, options) {
		const collectionConfig = super.generateCollectionConfig(key, path, options);

		if (path !== options.basePath) {
			collectionConfig.glob =
				typeof collectionConfig.glob === 'string'
					? [collectionConfig.glob]
					: collectionConfig.glob || [];
			collectionConfig.glob.push('!_index.md');
		}

		const dataPath = this.getHugoDataPath(options.config);
		collectionConfig.output = !(path === dataPath || path.endsWith(`/${dataPath}`));

		return collectionConfig;
	}

	/**
	 * Returns the path to the Hugo data folder, optionally prepended with a base path.
	 *
	 * @param config {Record<string, any> | undefined}
	 * @param basePath {string=}
	 * @returns {string}
	 */
	getHugoDataPath(config, basePath) {
		return joinPaths([basePath, normalisePath(config?.dataDir ?? 'data') ?? 'data']);
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
		const dataPath = this.getHugoDataPath(options.config, options.basePath);
		return collectionPaths.filter((path) => path !== dataPath && !path.startsWith(`${dataPath}/`));
	}

	/**
	 * Generates collections config from a set of paths.
	 *
	 * @param collectionPaths {string[]}
	 * @param options {{ config?: Record<string, any>; source?: string; basePath: string; }}
	 * @returns {import('../types').CollectionsConfig}
	 */
	generateCollectionsConfig(collectionPaths, options) {
		const collectionPathsOutsideExampleSite = collectionPaths.filter(
			(path) => !path.includes('exampleSite/'),
		);

		const hasNonExampleSiteCollections =
			collectionPathsOutsideExampleSite.length &&
			collectionPathsOutsideExampleSite.length !== collectionPaths.length;

		if (hasNonExampleSiteCollections) {
			// Exclude collections found inside the exampleSite folder, unless they are the only collections
			return super.generateCollectionsConfig(collectionPathsOutsideExampleSite, {
				...options,
				basePath: findBasePath(collectionPathsOutsideExampleSite),
			});
		}

		return super.generateCollectionsConfig(collectionPaths, options);
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

		if (options.attributes) {
			/** @type {import('@cloudcannon/configuration-types').MarkdownAttributeElementOptions} */
			const attribute_elements = {};

			/** @type {(keyof HTMLElementTagNameMap)[]} */
			const headingTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
			headingTags.forEach((tag) => {
				attribute_elements[tag] = !!parser?.attribute?.title ? 'space right' : 'none';
			});

			/** @type {(keyof HTMLElementTagNameMap)[]} */
			const otherTags = ['blockquote', 'hr', 'ol', 'ul', 'p', 'table'];
			otherTags.forEach((tag) => {
				attribute_elements[tag] = !!parser?.attribute?.block ? 'below' : 'none';
			});

			const imgAttrsAllowed =
				!!parser?.attribute?.block && parser?.wrapStandAloneImageWithinParagraph === false;
			attribute_elements.img = imgAttrsAllowed ? 'below' : 'none';

			options.attribute_elements = attribute_elements;
		}

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
			value: 'hugo -b /',
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

		commands.preserved.push(
			{
				value: 'resources/',
				attribution: 'recommended for speeding up Hugo builds',
			},
			{
				value: '.hugo_cache/',
				attribution: 'recommended for speeding up Hugo builds',
			},
		);

		return commands;
	}
}
