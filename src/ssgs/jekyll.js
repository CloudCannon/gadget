import { decodeEntity } from '../utility.js';
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
	 * @returns {import('@cloudcannon/configuration-types').CollectionConfig}
	 */
	generateCollectionConfig(key, path) {
		const collectionConfig = super.generateCollectionConfig(key, path);
		// TODO: read contents of _config.yml to find which collections are output
		collectionConfig.output = key !== 'data';

		if (isPostsPath(collectionConfig.path)) {
			collectionConfig.create ||= {
				path: '[relative_base_path]/{date|year}-{date|month}-{date|day}-{title|slugify}.[ext]',
			};

			collectionConfig.add_options ||= [
				{
					name: `Add ${collectionConfig.singular_name || 'Post'}`,
				},
				{
					name: 'Add Draft',
					collection: key.replace('posts', 'drafts'),
				},
			];
		}

		if (isDraftsPath(collectionConfig.path)) {
			collectionConfig.create ||= {
				path: '', // TODO: this should not be required if publish_to is set
				publish_to: key.replace('drafts', 'posts'),
			};
		}

		return collectionConfig;
	}

	/**
	 * Generates collections config from a set of paths.
	 *
	 * @param collectionPaths {{ basePath: string, paths: string[] }}
	 * @param source {string | undefined}
	 * @returns {import('../types').CollectionsConfig}
	 */
	generateCollectionsConfig(collectionPaths, source) {
		const collectionsConfig = super.generateCollectionsConfig(collectionPaths, source);

		const keys = Object.keys(collectionsConfig);

		for (const key of keys) {
			const collectionConfig = collectionsConfig[key];

			if (isDraftsPath(collectionConfig.path) && collectionConfig.path) {
				// Ensure there is a matching posts collection
				const postsKey = key.replace('drafts', 'posts');
				collectionsConfig[postsKey] ||= this.generateCollectionConfig(
					postsKey,
					collectionConfig.path?.replace(/\b_drafts$/, '_posts'),
				);
			} else if (isPostsPath(collectionConfig.path) && collectionConfig.path) {
				// Ensure there is a matching drafts collection
				const draftsKey = key.replace('posts', 'drafts');
				collectionsConfig[draftsKey] ||= this.generateCollectionConfig(
					draftsKey,
					collectionConfig.path?.replace(/\b_posts$/, '_drafts'),
				);
			}
		}

		return collectionsConfig;
	}

	/**
	 * @param config {Record<string, any> | undefined}
	 * @returns {import('@cloudcannon/configuration-types').MarkdownSettings}
	 */
	generateMarkdownConfig(config) {
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
}
