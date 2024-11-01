import { decodeEntity, joinPaths, stripTopPath } from '../utility.js';
import { kramdownAttributeElementOptions } from '../defaults.js';
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
 * Generates posts _inputs configuration.
 *
 * @param collectionKey {string} The posts key.
 * @returns {Record<string, import('@cloudcannon/configuration-types').Input>}
 */
function generatePostsInputs(collectionKey) {
	return {
		categories: {
			type: 'multiselect',
			options: {
				values: `collections.${collectionKey}[*].categories`,
				allow_create: true,
			},
		},
		tags: {
			type: 'multiselect',
			options: {
				values: `collections.${collectionKey}[*].tags`,
				allow_create: true,
			},
		},
	};
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
			'assets/', // popular assets plugin folder
			'.jekyll-cache/', // cache
			'.jekyll-metadata/', // cache
		]);
	}

	// _posts and _drafts excluded here as they are potentially nested deeper.
	conventionalPathsInSource = ['_plugins/', '_includes/', '_data/', '_layouts/', '_sass/'];

	/**
	 * Generates a collection config entry.
	 *
	 * @param key {string}
	 * @param path {string}
	 * @param options {import('../types').GenerateCollectionConfigOptionsJekyll}
	 * @returns {import('@cloudcannon/configuration-types').CollectionConfig}
	 */
	generateCollectionConfig(key, path, options) {
		const collectionConfig = super.generateCollectionConfig(key, path, options);

		const isKnownOutputCollection =
			key === 'pages' ||
			key === 'posts' ||
			key.endsWith('_posts') ||
			key === 'drafts' ||
			key.endsWith('_drafts');

		if (key === 'data') {
			collectionConfig.disable_url = true;
			collectionConfig.disable_add = true;
			collectionConfig.disable_add_folder = true;
			collectionConfig.disable_file_actions = true;
		} else if (!options.collection?.output && !isKnownOutputCollection) {
			collectionConfig.disable_url = true;
		}

		if (options.collection?.sort_by && typeof options.collection?.sort_by === 'string') {
			collectionConfig.sort = { key: options.collection.sort_by };
		}

		if (isPostsPath(collectionConfig.path)) {
			collectionConfig.create ||= {
				path: '[relative_base_path]/{date|year}-{date|month}-{date|day}-{title|slugify}.[ext]',
			};

			collectionConfig._inputs = generatePostsInputs(key);

			collectionConfig.add_options ||= [
				{ name: `Add ${collectionConfig.singular_name || 'Post'}` },
				{ name: 'Add Draft', collection: toDraftsKey(key) },
			];
		} else if (isDraftsPath(collectionConfig.path)) {
			const postsKey = toPostsKey(key);

			collectionConfig.create ||= {
				path: '', // TODO: this should not be required if publish_to is set
				publish_to: postsKey,
			};

			collectionConfig._inputs = generatePostsInputs(postsKey);
		}

		return collectionConfig;
	}

	/**
	 * Generates collections config from a set of paths.
	 *
	 * @param collectionPaths {string[]}
	 * @param options {import('../types').GenerateCollectionsConfigOptions}
	 * @returns {import('../types').CollectionsConfig}
	 */
	generateCollectionsConfig(collectionPaths, options) {
		/** @type {import('../types').CollectionsConfig} */
		const collectionsConfig = {};
		const collectionsDir = options.config?.collections_dir || '';
		const collections = getJekyllCollections(options.config?.collections);

		// Handle defined collections.
		for (const key of Object.keys(collections)) {
			const collectionKey = key === 'pages' || key === 'data' ? `collection_${key}` : key;
			const path = joinPaths([collectionsDir, `_${key}`]);
			const collection = collections[key];

			collectionsConfig[collectionKey] = this.generateCollectionConfig(collectionKey, path, {
				...options,
				collectionPaths,
				collection,
			});
		}

		const sortedPaths = collectionPaths.sort((a, b) => a.length - b.length);

		// Use detected content folders to handle automatic/default collections.
		for (const fullPath of sortedPaths) {
			const path = stripTopPath(fullPath, options.source);

			const isDefaultCollection =
				sortedPaths.length === 1 || // a subfolder if no content files in root
				path === '' || // root folder
				path === '_data' ||
				path.startsWith('_data/') ||
				path === '_posts' ||
				path.endsWith('/_posts') ||
				path === '_drafts' ||
				path.endsWith('/_drafts');

			if (!isDefaultCollection) {
				continue;
			}

			const exists = Object.keys(collectionsConfig).some((key) => {
				return collectionsConfig[key].path === path;
			});

			if (exists) {
				continue;
			}

			const pathInCollectionsDir = stripTopPath(path, collectionsDir);
			const key = this.generateCollectionsConfigKey(pathInCollectionsDir, collectionsConfig);
			const collection = collections[stripTopPath(path, collectionsDir).replace(/^\/?_/, '')];
			collectionsConfig[key] = this.generateCollectionConfig(key, path, {
				...options,
				collectionPaths,
				collection,
			});
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
					{
						...options,
						collectionPaths,
						collection: collections?.posts,
					},
				);
			} else if (isPostsPath(collectionConfig.path)) {
				// Ensure there is a matching drafts collection
				const draftsKey = toDraftsKey(key);
				collectionsConfig[draftsKey] ||= this.generateCollectionConfig(
					draftsKey,
					toDraftsPath(collectionConfig.path),
					{
						...options,
						collectionPaths,
						collection: collections?.drafts || collections?.posts,
					},
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
			 */

			options.attributes = true;
			options.attribute_elements = kramdownAttributeElementOptions;
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

		const gemfilePath = filePaths.find((path) => path === 'Gemfile' || path.endsWith('/Gemfile'));
		if (gemfilePath) {
			commands.install.unshift({
				value: 'bundle install',
				attribution: 'because of your Gemfile',
			});
			commands.build.unshift({
				value: 'bundle exec jekyll build',
				attribution: 'because of your Gemfile',
			});
			commands.preserved.push({
				value: '.bundle_cache/',
				attribution: 'recommended for speeding up bundler installs',
			});
			commands.environment['GEM_HOME'] = {
				value: '/usr/local/__site/src/.bundle_cache/',
				attribution: 'recommended for speeding up bundler installs',
			};

			if (options.source) {
				commands.environment['BUNDLE_GEMFILE'] = {
					value: gemfilePath,
					attribution: 'because of your Gemfile',
				};
			}
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

	/**
	 * Generates path configuration
	 *
	 * @returns {import('@cloudcannon/configuration-types').SnippetsImports | undefined}
	 */
	getSnippetsImports() {
		return { 
			...super.getSnippetsImports(),
			jekyll: true
		};
	}
}
