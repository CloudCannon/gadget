import { decodeEntity, joinPaths, stripTopPath } from '../utility.js';
import Ssg from './ssg.js';

/**
 * Checks if this is a Jekyll drafts collection path.
 *
 * @param path {string | undefined} The path to check.
 * @returns {boolean}
 */
function isDraftsPath(path) {
	return !!path?.match(/\b_drafts$/);
}

/**
 * Checks if this is a Jekyll posts collection path.
 *
 * @param path {string | undefined} The path to check.
 * @returns {boolean}
 */
function isPostsPath(path) {
	return !!path?.match(/\b_posts$/);
}

/**
 * Transforms a Jekyll drafts collection path into a posts path.
 *
 * @param path {string} The drafts path.
 * @returns {string}
 */
function toDraftsPath(path) {
	return path.replace(/\b_posts$/, '_drafts');
}

/**
 * Transforms a Jekyll posts collection path into a drafts path.
 *
 * @param path {string} The posts path.
 * @returns {string}
 */
function toPostsPath(path) {
	return path.replace(/\b_drafts$/, '_posts');
}

/**
 * Transforms a drafts collection key into a posts key.
 *
 * @param key {string} The drafts key.
 * @returns {string}
 */
function toDraftsKey(key) {
	return key.replace('posts', 'drafts');
}

/**
 * Transforms a posts collection key into a drafts key.
 *
 * @param key {string} The posts key.
 * @returns {string}
 */
function toPostsKey(key) {
	return key.replace('drafts', 'posts');
}

/**
 * Gets `collections` from Jekyll configuration in a standard format.
 *
 * @param collections {Record<string, any> | undefined} The `collections` object from Jekyll config
 * @returns {Record<string, any>}
 */
function getJekyllCollections(collections) {
	/** @type {Record<string, any>} */
	let formatted = {};

	if (Array.isArray(collections)) {
		return collections.reduce((memo, key) => {
			memo[key] = {};
			return memo;
		}, formatted);
	}

	if (typeof collections === 'object') {
		return collections;
	}

	return formatted;
}

/**
 * Checks if a Jekyll collection is output.
 *
 * @param key {string}
 * @param collection {Record<string, any> | undefined}
 * @returns {boolean}
 */
function isCollectionOutput(key, collection) {
	if (key === 'data' || key === 'drafts' || key.endsWith('_drafts')) {
		return false;
	}

	return key === 'pages' || key === 'posts' || key.endsWith('_posts') || !!collection?.output;
}

export default class Jekyll extends Ssg {
	constructor() {
		super('jekyll');
	}

	configPaths() {
		return super.configPaths().concat(['_config.yml', '_config.yaml', '_config.toml']);
	}

	templateExtensions() {
		return super.templateExtensions().concat(['.liquid']);
	}

	contentExtensions() {
		return super.contentExtensions().concat(['.html']);
	}

	partialFolders() {
		return super.partialFolders().concat(['_layouts/', '_includes/']);
	}

	ignoredFolders() {
		return super.ignoredFolders().concat([
			'_site/', // build output
			'.jekyll-cache/', // cache
			'.jekyll-metadata/', // cache
		]);
	}

	// _posts and _drafts excluded here as they are potentially nested deeper.
	static conventionPaths = ['_plugins/', '_includes/', '_data/', '_layouts/', '_sass/'];

	/**
	 * Attempts to find the most likely source folder for a Jekyll site.
	 *
	 * @param filePaths {string[]} List of input file paths.
	 * @returns {{ filePath?: string, conventionPath?: string }}
	 */
	_findConventionPath(filePaths) {
		for (let i = 0; i < filePaths.length; i++) {
			for (let j = 0; j < filePaths.length; j++) {
				if (
					filePaths[i].startsWith(Jekyll.conventionPaths[j]) ||
					filePaths[i].includes(Jekyll.conventionPaths[j])
				) {
					return {
						filePath: filePaths[i],
						conventionPath: Jekyll.conventionPaths[j],
					};
				}
			}
		}

		return {};
	}

	/**
	 * Attempts to find the most likely source folder for a Jekyll site.
	 *
	 * @param filePaths {string[]} List of input file paths.
	 * @returns {string | undefined}
	 */
	getSource(filePaths) {
		const { filePath, conventionPath } = this._findConventionPath(filePaths);

		if (filePath && conventionPath) {
			const conventionIndex = filePath.indexOf(conventionPath);
			return filePath.substring(0, Math.max(0, conventionIndex - 1));
		}

		return super.getSource(filePaths);
	}

	/**
	 * Generates a collection config entry.
	 *
	 * @param key {string}
	 * @param path {string}
	 * @param options {{ basePath?: string; collection: Record<string, any> | undefined; }}
	 * @returns {import('@cloudcannon/configuration-types').CollectionConfig}
	 */
	generateCollectionConfig(key, path, options) {
		const collectionConfig = super.generateCollectionConfig(key, path);

		collectionConfig.output = isCollectionOutput(key, options.collection);

		if (options.collection?.sort_by) {
			collectionConfig.sort = { key: options.collection.sort_by };
		}

		if (isPostsPath(collectionConfig.path)) {
			collectionConfig.create ||= {
				path: '[relative_base_path]/{date|year}-{date|month}-{date|day}-{title|slugify}.[ext]',
			};

			collectionConfig.add_options ||= [
				{ name: `Add ${collectionConfig.singular_name || 'Post'}` },
				{ name: 'Add Draft', collection: toDraftsKey(key) },
			];
		}

		if (isDraftsPath(collectionConfig.path)) {
			collectionConfig.create ||= {
				path: '', // TODO: this should not be required if publish_to is set
				publish_to: toPostsKey(key),
			};
		}

		return collectionConfig;
	}

	/**
	 * Generates collections config from a set of paths.
	 *
	 * @param collectionPaths {{ basePath: string, paths: string[] }}
	 * @param options {{ config?: Record<string, any>; source?: string; }=}
	 * @returns {import('../types').CollectionsConfig}
	 */
	generateCollectionsConfig(collectionPaths, options) {
		/** @type {import('../types').CollectionsConfig} */
		const collectionsConfig = {};
		const collectionsDir = options?.config?.collections_dir || '';
		const collections = getJekyllCollections(options?.config?.collections);

		// Content folder to collections_config mapping.
		for (const fullPath of collectionPaths.paths) {
			const path = stripTopPath(fullPath, options?.source);
			const pathInCollectionsDir = collectionsDir ? stripTopPath(path, collectionsDir) : path;
			const key = this.generateCollectionsConfigKey(pathInCollectionsDir, collectionsConfig);
			const collection = collections[stripTopPath(path, collectionsDir).replace(/^\/?_/, '')];
			collectionsConfig[key] = this.generateCollectionConfig(key, path, { collection });
		}

		// Handle defined collections without files.
		for (const key of Object.keys(collections)) {
			collectionsConfig[key] ||= {
				path: joinPaths([collectionsDir, `_${key}`]),
				output: isCollectionOutput(key, collections[key]),
			};
		}

		// Add matching post/draft collections
		for (const key of Object.keys(collectionsConfig)) {
			const collectionConfig = collectionsConfig[key];
			if (!collectionConfig.path) {
				continue;
			}

			if (isDraftsPath(collectionConfig.path)) {
				// Ensure there is a matching posts collection
				const postsKey = toPostsKey(key);
				collectionsConfig[postsKey] ||= this.generateCollectionConfig(
					postsKey,
					toPostsPath(collectionConfig.path),
					{ collection: collections?.posts },
				);
			} else if (isPostsPath(collectionConfig.path)) {
				// Ensure there is a matching drafts collection
				const draftsKey = toDraftsKey(key);
				collectionsConfig[draftsKey] ||= this.generateCollectionConfig(
					draftsKey,
					toDraftsPath(collectionConfig.path),
					{ collection: collections?.drafts || collections?.posts },
				);
			}
		}

		return collectionsConfig;
	}

	/**
	 * @param config {Record<string, any> | undefined}
	 * @returns {import('@cloudcannon/configuration-types').MarkdownSettings}
	 */
	generateMarkdown(config) {
		const engine = config?.['markdown']?.includes('CommonMark') ? 'commonmark' : 'kramdown';
		/** @type {import('@cloudcannon/configuration-types').MarkdownSettings['options']} */
		const options = {};

		if (engine === 'kramdown') {
			const kramdownConfig = config?.['kramdown'] || {};
			// https://kramdown.gettalong.org/options.html
			options.heading_ids = !!kramdownConfig.auto_ids;
			options.gfm = !kramdownConfig.input || kramdownConfig.input !== 'GFM' ? false : true;
			options.breaks = !!kramdownConfig.hard_wrap;
			const smartquotes = kramdownConfig.smart_quotes;
			if (smartquotes && typeof smartquotes === 'string') {
				options.quotes = smartquotes.replace(/\s/g, '').split(',').map(decodeEntity).join('');
			}
			// https://github.com/kramdown/parser-gfm
			options.typographer =
				options.gfm && !kramdownConfig.gfm_quirks?.includes?.('no_auto_typographic');

			/**
			 * Several options in Kramdown can be enabled implicitly if using GFM mode
			 * Historically these options have been disabled in CloudCannon,
			 * so I'm thinking we'll leave them disabled until explicitly set in CC config,
			 * since there is no way to explicitly set them in Kramdown config.
			 * e.g. strikethrough
			 * attributes is a similar example
			 */
		} else if (config) {
			const commonmarkConfig = config?.['commonmark'] || {};

			/** @type {(name: string) => boolean} */
			const checkOption = (name) => {
				return (
					commonmarkConfig.options?.includes(name.toLowerCase()) ||
					commonmarkConfig.options?.includes(name.toUpperCase())
				);
			};
			/** @type {(name: string) => boolean} */
			const checkExtension = (name) => {
				return (
					commonmarkConfig.extensions?.includes(name.toLowerCase()) ||
					commonmarkConfig.extensions?.includes(name.toUpperCase())
				);
			};

			// https://github.com/gjtorikian/commonmarker?tab=readme-ov-file#options
			options.gfm = checkOption('gfm_quirks');
			options.breaks = checkOption('hardbreaks');
			options.strikethrough = checkExtension('strikethrough');
			options.table = checkExtension('table');
			options.linkify = checkExtension('autolink');
			options.superscript = checkExtension('superscript');
			options.heading_ids = checkExtension('header_ids');
		}

		options.treat_indentation_as_code = true;

		return {
			engine,
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

		if (filePaths.includes(joinPaths([options.source, 'Gemfile']))) {
			commands.install.unshift({
				value: 'bundle install',
				attribution: 'because of your Gemfile',
			});
			commands.build.unshift({
				value: 'bundle exec jekyll build',
				attribution: 'because of your Gemfile',
			});
		} else {
			commands.build.unshift({
				value: 'jekyll build',
				attribution: 'most common for Jekyll sites',
			});
		}

		commands.output.unshift({
			value: '_site',
			attribution: 'most common for Jekyll sites',
		});

		commands.environment['JEKYLL_ENV'] = {
			value: 'production',
			attribution: 'recommended for hosted Jekyll sites',
		};

		return commands;
	}
}
