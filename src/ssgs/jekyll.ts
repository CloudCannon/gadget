import type {
	CollectionConfig,
	Input,
	MarkdownSettings,
	SnippetsImports,
} from '@cloudcannon/configuration-types';
import slugify from '@sindresorhus/slugify';
import { getCollectionPaths } from '../collections.ts';
import { kramdownAttributeElementOptions } from '../defaults.ts';
import { findIcon } from '../icons.ts';
import { decodeEntity, join, stripBottomPath, stripTopPath } from '../utility.ts';
import Ssg, {
	type BuildCommands,
	type CollectionConfigTree,
	type GenerateBuildCommandsOptions,
	type GenerateCollectionConfigOptions,
	type GenerateCollectionsConfigOptions,
} from './ssg.ts';

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
				{ name: 'Add Post' },
				{ name: 'Add Draft', collection: toDraftsKey(key) },
			];
		} else if (isDraftsPath(collectionConfig.path)) {
			const postsKey = toPostsKey(key);
			collectionConfig.create ||= { publish_to: postsKey };
			collectionConfig._inputs = generatePostsInputs(postsKey);
		}

		return collectionConfig;
	}

	isSuggestedCollection(
		path: string,
		collectionPaths: string[],
		options: GenerateCollectionsConfigOptions & {
			jekyllCollections: Record<string, any>;
			jekyllCollectionsDir: string | undefined;
		}
	): boolean {
		const isDefaultCollection =
			collectionPaths.length === 1 || // a subfolder if no content files in root
			path === '' || // root folder
			path === '_data' ||
			path.startsWith('_data/') ||
			path === '_posts' ||
			path.endsWith('/_posts') ||
			path === '_drafts' ||
			path.endsWith('/_drafts');

		if (isDefaultCollection) {
			return true;
		}

		const collectionKey = stripTopPath(path, options.jekyllCollectionsDir).replace(/^\/?_/, '');
		return collectionKey in options.jekyllCollections;
	}

	/**
	 * Generates a tree from a set of paths for selectively creating a collections_config.
	 */
	generateCollectionsConfigTree(
		collectionPaths: string[],
		options: GenerateCollectionsConfigOptions
	): CollectionConfigTree[] {
		const collectionsDir = options.ssgConfig?.collections_dir || '';
		const collections = getJekyllCollections(options.ssgConfig?.collections);

		// Handle defined collections.
		for (const key of Object.keys(collections)) {
			const path = join(options.source, collectionsDir, `_${key}`);
			if (!collectionPaths.includes(path)) {
				collectionPaths.push(path);
			}
		}

		const allCollectionPaths =
			collectionPaths.length === 1
				? collectionPaths
				: collectionPaths.reduce((memo, path) => {
						const allPaths = getCollectionPaths(path);

						for (let i = 0; i < allPaths.length; i++) {
							if (allPaths[i].startsWith(options.basePath)) {
								memo.add(allPaths[i]);

								if (isDraftsPath(path)) {
									// Ensure there is a matching posts collection
									memo.add(toPostsPath(path));
								} else if (isPostsPath(path)) {
									// Ensure there is a matching drafts collection
									memo.add(toDraftsPath(path));
								}
							}
						}
						memo.add(path);
						return memo;
					}, new Set<string>());

		const sortedPaths = Array.from(allCollectionPaths).sort((x, y) => {
			return x.length - y.length || (x > y ? 1 : -1);
		});

		const seenKeys: Record<string, CollectionConfigTree> = {};
		const seenPaths: Record<string, CollectionConfigTree> = {};
		const trees: CollectionConfigTree[] = [];
		const contentPrefix = slugify(collectionsDir, { separator: '_' });
		const existingCollections = this.getExistingCollections(
			options?.config?.collections_config || {}
		);

		for (let i = 0; i < sortedPaths.length; i++) {
			const path = stripTopPath(sortedPaths[i], options.source);

			const key =
				existingCollections.byPath[path]?.key ||
				this.generateCollectionsConfigKey(
					path,
					Object.keys(seenKeys).concat(existingCollections.keys),
					{
						fallback: !path ? 'source' : 'pages',
						contentPrefix,
					}
				);

			let collection = collections[stripTopPath(path, collectionsDir).replace(/^\/?_/, '')];
			if (!collection) {
				if (isDraftsPath(path)) {
					collection = collections?.posts;
				} else if (isPostsPath(path)) {
					collection = collections?.drafts || collections?.posts;
				}
			}

			const tree: CollectionConfigTree = {
				key,
				suggested: this.isSuggestedCollection(path, collectionPaths, {
					...options,
					jekyllCollections: collections,
					jekyllCollectionsDir: collectionsDir,
				}),
				config:
					existingCollections.byPath[path]?.config ||
					this.generateCollectionConfig(key, path, {
						...options,
						collectionPaths,
						collection,
					}),
				collections: [],
			};

			const parentPath = stripBottomPath(path);
			const parent = seenPaths[parentPath];

			seenPaths[path] = tree;
			seenKeys[key] = tree;

			if (parent) {
				parent.collections.push(tree);
			} else {
				trees.push(tree);
			}
		}

		if (seenKeys.source && !seenKeys.pages && !existingCollections.keys.includes('source')) {
			// Clean up the generated source collection if there is no pages entry
			seenKeys.source.key = 'pages';
			seenKeys.source.config.icon = findIcon('pages');
			delete seenKeys.source.config.disable_url;
		}

		return trees;
	}

	generateMarkdown(ssgConfig: Record<string, any> | undefined): MarkdownSettings {
		const engine = ssgConfig?.markdown?.includes('CommonMark') ? 'commonmark' : 'kramdown';
		const options: MarkdownSettings['options'] = {};

		if (engine === 'kramdown') {
			const kramdownConfig = ssgConfig?.kramdown || {};
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
		} else if (ssgConfig) {
			const commonmarkConfig = ssgConfig?.commonmark || {};

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
