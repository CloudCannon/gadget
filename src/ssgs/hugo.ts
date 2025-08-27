import type {
	CollectionConfig,
	MarkdownAttributeElementOptions,
	MarkdownSettings,
	Paths,
	SnippetsImports,
} from '@cloudcannon/configuration-types';
import { findBasePath } from '../collections';
import { decodeEntity, joinPaths, normalisePath } from '../utility';
import Ssg, {
	type GenerateBuildCommandsOptions,
	type BuildCommands,
	type GenerateCollectionConfigOptions,
	type GenerateCollectionsConfigOptions,
} from './ssg';

export default class Hugo extends Ssg {
	constructor() {
		super('hugo');
	}

	configPaths(): string[] {
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

	templateExtensions(): string[] {
		return [];
	}

	partialFolders(): string[] {
		return super.partialFolders().concat([
			'archetypes/', // scaffolding templates
		]);
	}

	ignoredFiles(): string[] {
		return super.ignoredFiles().concat([
			'theme.toml', // config file for a hugo theme repo
		]);
	}

	ignoredFolders(): string[] {
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
	 */
	generateCollectionConfig(
		key: string,
		path: string,
		options: GenerateCollectionConfigOptions
	): CollectionConfig {
		const collectionConfig = super.generateCollectionConfig(key, path, options);

		const hasParentCollectionPath = options.collectionPaths.some((otherCollectionPath) => {
			return joinPaths([options.source, path]).startsWith(`${otherCollectionPath}/`);
		});

		if (hasParentCollectionPath) {
			collectionConfig.glob =
				typeof collectionConfig.glob === 'string'
					? [collectionConfig.glob]
					: collectionConfig.glob || [];
			collectionConfig.glob.push('!_index.md');
		}

		const dataPath = this.getHugoDataPath(options.config);

		if (path === dataPath || path.endsWith(`/${dataPath}`)) {
			collectionConfig.disable_url = true;
			collectionConfig.disable_add = true;
			collectionConfig.disable_add_folder = true;
			collectionConfig.disable_file_actions = true;
		}

		return collectionConfig;
	}

	/**
	 * Returns the path to the Hugo data folder, optionally prepended with a base path.
	 */
	getHugoDataPath(config: Record<string, any> | undefined, basePath?: string): string {
		return joinPaths([basePath, normalisePath(config?.dataDir ?? 'data') ?? 'data']);
	}

	/**
	 * Filters out collection paths that are collections, but exist in isolated locations.
	 * Used when a data folder (or similar) is causing all collections to group under one
	 * `collections_config` entry.
	 */
	filterContentCollectionPaths(
		collectionPaths: string[],
		options: GenerateCollectionsConfigOptions
	): string[] {
		const dataPath = this.getHugoDataPath(options.config, options.basePath);
		return collectionPaths.filter((path) => path !== dataPath && !path.startsWith(`${dataPath}/`));
	}

	/**
	 * Generates collections config from a set of paths.
	 */
	generateCollectionsConfig(
		collectionPaths: string[],
		options: GenerateCollectionsConfigOptions
	): Record<string, CollectionConfig> {
		// Remove collection paths with a parent collection path and only a branch index file
		collectionPaths = collectionPaths.filter((collectionPath) => {
			const hasNonBranchIndexFile = options.filePaths.some(
				(filePath) => filePath.startsWith(`${collectionPath}/`) && !filePath.endsWith('/_index.md')
			);

			const hasParentCollectionPath = collectionPaths.some((otherCollectionPath) =>
				collectionPath.startsWith(`${otherCollectionPath}/`)
			);

			return hasNonBranchIndexFile || !hasParentCollectionPath;
		});

		const collectionPathsOutsideExampleSite = collectionPaths.filter(
			(path) => !path.includes('exampleSite/')
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

	generateMarkdown(config: Record<string, any> | undefined): MarkdownSettings {
		const goldmark = config?.markup?.goldmark || {};
		const { extensions, parser, renderer } = goldmark;
		const extras = extensions?.extras || {};

		const options: MarkdownSettings['options'] = {
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
			const attributeElements: MarkdownAttributeElementOptions = {};

			const headingTags: (keyof HTMLElementTagNameMap)[] = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
			headingTags.forEach((tag) => {
				attributeElements[tag] = parser?.attribute?.title ? 'space right' : 'none';
			});

			const otherTags: (keyof HTMLElementTagNameMap)[] = [
				'blockquote',
				'hr',
				'ol',
				'ul',
				'p',
				'table',
			];
			otherTags.forEach((tag) => {
				attributeElements[tag] = parser?.attribute?.block ? 'below' : 'none';
			});

			const imgAttrsAllowed =
				!!parser?.attribute?.block && parser?.wrapStandAloneImageWithinParagraph === false;
			attributeElements.img = imgAttrsAllowed ? 'below' : 'none';

			options.attribute_elements = attributeElements;
		}

		return {
			engine: 'commonmark',
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

		commands.build.unshift({
			value: 'hugo -b /',
			attribution: 'most common for Hugo sites',
		});
		commands.output.unshift({
			value: 'public',
			attribution: 'most common for Hugo sites',
		});

		commands.environment.HUGO_CACHEDIR = {
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
			}
		);

		return commands;
	}

	getSnippetsImports(): SnippetsImports | undefined {
		return {
			...super.getSnippetsImports(),
			hugo: {
				exclude: ['hugo_instagram'],
			},
		};
	}

	/**
	 * Generates path configuration.
	 */
	getPaths(): Paths | undefined {
		return {
			...super.getPaths(),
			static: 'static',
			uploads: 'static/uploads',
		};
	}
}
