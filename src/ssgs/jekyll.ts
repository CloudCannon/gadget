import type {
	CollectionConfig,
	Input,
	MarkdownSettings,
	SnippetsImports,
} from '@cloudcannon/configuration-types';
import { kramdownAttributeElementOptions } from '../defaults';
import { decodeEntity, joinPaths, stripTopPath } from '../utility';
import Ssg, {
	type BuildCommands,
	type GenerateBuildCommandsOptions,
	type GenerateCollectionConfigOptions,
	type GenerateCollectionsConfigOptions,
} from './ssg';

export interface GenerateCollectionConfigOptionsJekyll extends GenerateCollectionConfigOptions {
	/** The matching Jekyll collection from _config.yml */
	collection: Record<string, any> | undefined;
}

/**
 * Checks if this is a Jekyll drafts collection path.
 */
function isDraftsPath(path: string): boolean {
	return !!path?.match(/\b_drafts$/);
}

/**
 * Checks if this is a Jekyll posts collection path.
 */
function isPostsPath(path: string): boolean {
	return !!path?.match(/\b_posts$/);
}

/**
 * Transforms a Jekyll drafts collection path into a posts path.
 */
function toDraftsPath(path: string): string {
	return path.replace(/\b_posts$/, '_drafts');
}

/**
 * Transforms a Jekyll posts collection path into a drafts path.
 */
function toPostsPath(path: string): string {
	return path.replace(/\b_drafts$/, '_posts');
}

/**
 * Transforms a drafts collection key into a posts key.
 */
function toDraftsKey(key: string): string {
	return key.replace('posts', 'drafts');
}

/**
 * Transforms a posts collection key into a drafts key.
 */
function toPostsKey(key: string): string {
	return key.replace('drafts', 'posts');
}

/**
 * Generates posts _inputs configuration.
 */
function generatePostsInputs(collectionKey: string): Record<string, Input> {
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
 */
function getJekyllCollections(collections: Record<string, any> | undefined): Record<string, any> {
	const formatted: Record<string, any> = {};

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

	configPaths(): string[] {
		return super.configPaths().concat(['_config.yml', '_config.yaml', '_config.toml']);
	}

	templateExtensions(): string[] {
		return super.templateExtensions().concat(['.liquid']);
	}

	contentExtensions(): string[] {
		return super.contentExtensions().concat(['.html']);
	}

	partialFolders(): string[] {
		return super.partialFolders().concat(['_layouts/', '_includes/']);
	}

	ignoredFolders(): string[] {
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
	 */
	generateCollectionConfig(
		key: string,
		path: string,
		options: GenerateCollectionConfigOptionsJekyll
	): CollectionConfig {
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
			collectionConfig.sort_options = [{ key: options.collection.sort_by }];
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
	 */
	generateCollectionsConfig(
		collectionPaths: string[],
		options: GenerateCollectionsConfigOptions
	): Record<string, CollectionConfig> {
		const collectionsConfig: Record<string, CollectionConfig> = {};
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
					}
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
					}
				);
			}
		}

		return collectionsConfig;
	}

	generateMarkdown(config: Record<string, any> | undefined): MarkdownSettings {
		const engine = config?.markdown?.includes('CommonMark') ? 'commonmark' : 'kramdown';
		const options: MarkdownSettings['options'] = {};

		if (engine === 'kramdown') {
			const kramdownConfig = config?.kramdown || {};
			// https://kramdown.gettalong.org/options.html
			options.heading_ids = !!kramdownConfig.auto_ids;
			options.gfm = kramdownConfig.input === 'GFM';
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
			const commonmarkConfig = config?.commonmark || {};

			const checkOption = (name: string): boolean => {
				return (
					commonmarkConfig.options?.includes(name.toLowerCase()) ||
					commonmarkConfig.options?.includes(name.toUpperCase())
				);
			};
			const checkExtension = (name: string): boolean => {
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
	 */
	async generateBuildCommands(
		filePaths: string[],
		options: GenerateBuildCommandsOptions
	): Promise<BuildCommands> {
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
			commands.environment.GEM_HOME = {
				value: '/usr/local/__site/src/.bundle_cache/',
				attribution: 'recommended for speeding up bundler installs',
			};

			if (options.source) {
				commands.environment.BUNDLE_GEMFILE = {
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

		commands.environment.JEKYLL_ENV = {
			value: 'production',
			attribution: 'recommended for hosted Jekyll sites',
		};

		return commands;
	}

	getSnippetsImports(): SnippetsImports | undefined {
		return {
			...super.getSnippetsImports(),
			jekyll: true,
		};
	}
}
