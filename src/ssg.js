import { extname } from 'path';

/** @typedef {'config' | 'content' | 'template' | 'partial' | 'ignored' | 'other'} FileType */
/** @typedef {'jekyll' | 'bridgetown' | 'eleventy' | 'hugo' | 'sveltekit' | 'nextjs' | 'unknown' } SsgKey */

export class Ssg {
	/** @type {SsgKey} */
	key;

	/** @type {string[]} */
	configPaths;

	/** @type {string[]} */
	templateExtensions;

	/** @type {string[]} */
	contentExtensions;

	/** @type {string[]} */
	partialFolders;

	/** @type {string[]} */
	ignoredFolders;

	/**
	 * @param key {SsgKey}
	 * @param configPaths {{ configPaths: string[], templateExtensions: string[], contentExtensions: string[], partialFolders: string[], ignoredFolders: string[] }}
	 */
	constructor(
		key,
		{ configPaths, templateExtensions, contentExtensions, partialFolders, ignoredFolders },
	) {
		this.key = key;
		this.configPaths = configPaths || [];
		this.templateExtensions = templateExtensions || [];
		this.contentExtensions = contentExtensions || [];
		this.partialFolders = partialFolders || [];
		this.ignoredFolders = ignoredFolders || [];
	}

	/**
	 * Checks if the file at this path is an SSG configuration file.
	 *
	 * @param filePath {string}
	 * @returns {boolean}
	 */
	isConfigPath(filePath) {
		return this.configPaths.some(
			(configPath) => filePath === configPath || filePath.endsWith(`/${configPath}`),
		);
	}

	/**
	 * Returns a score for how likely a file path relates to this SSG.
	 *
	 * @param filePath {string}
	 * @returns {number}
	 */
	getPathScore(filePath) {
		return this.isConfigPath(filePath) ? 1 : 0;
	}

	/**
	 * Checks if we should skip a file at this path
	 *
	 * @param filePath {string}
	 * @returns {boolean}
	 */
	isIgnoredPath(filePath) {
		return this.ignoredFolders.some((folder) => filePath.startsWith(folder));
	}

	/**
	 * Checks if the file at this path is a contains Markdown or structured content.
	 *
	 * @param filePath {string}
	 * @returns {boolean}
	 */
	isContentPath(filePath) {
		return this.contentExtensions.includes(extname(filePath));
	}

	/**
	 * Checks if the file at this path is an include, partial or layout file.
	 *
	 * @param filePath {string}
	 * @returns {boolean}
	 */
	isPartialPath(filePath) {
		return this.partialFolders.some(
			(partialFolder) => filePath === partialFolder || filePath.includes(`/${partialFolder}`),
		);
	}

	/**
	 * Checks if the file at this path is a template file.
	 *
	 * @param filePath {string}
	 * @returns boolean
	 */
	isTemplatePath(filePath) {
		return this.templateExtensions.includes(extname(filePath));
	}

	/**
	 * Finds the likely type of the file at this path.
	 *
	 * @param filePath {string}
	 * @returns {FileType}
	 */
	getFileType(filePath) {
		if (this.isIgnoredPath(filePath)) {
			return 'ignored';
		}

		if (this.isPartialPath(filePath)) {
			return 'partial';
		}

		if (this.isConfigPath(filePath)) {
			return 'config';
		}

		if (this.isTemplatePath(filePath)) {
			return 'template';
		}

		if (this.isContentPath(filePath)) {
			return 'content';
		}

		return 'other';
	}
}

const defaultContentExtensions = [
	'.md',
	'.mdown',
	'.markdown',
	'.mdx',
	'.json',
	'.yml',
	'.yaml',
	'.toml',
	'.csv',
	'.tsv',
];

const defaultIncludeFolders = [
	'layouts/', // general partials
	'components/', // general partials
	'component-library/', // general partials
	'schemas/', // CloudCannon schema files
];

const defaultTemplateExtensions = ['.htm', '.html'];

const unknownSsg = new Ssg('unknown', {
	configPaths: [],
	templateExtensions: defaultTemplateExtensions,
	contentExtensions: defaultContentExtensions,
	partialFolders: defaultIncludeFolders,
	ignoredFolders: [],
});

const ssgs = [
	new Ssg('hugo', {
		configPaths: ['config.toml', 'hugo.toml', 'hugo.yaml', 'hugo.json'],
		templateExtensions: [],
		contentExtensions: defaultContentExtensions,
		partialFolders: defaultIncludeFolders.concat(['archetypes/']),
		ignoredFolders: [
			'resources/', // cache
		],
	}),

	new Ssg('jekyll', {
		configPaths: ['_config.yml', '_config.yaml'],
		templateExtensions: defaultTemplateExtensions.concat(['.liquid']),
		contentExtensions: defaultContentExtensions,
		partialFolders: defaultIncludeFolders.concat(['_layouts/']),
		ignoredFolders: [
			'_site/', // build output
			'.jekyll-cache/', // cache
		],
	}),

	new Ssg('bridgetown', {
		configPaths: ['_config.yml', '_config.yaml'],
		templateExtensions: defaultTemplateExtensions.concat(['.liquid']),
		contentExtensions: defaultContentExtensions,
		partialFolders: defaultIncludeFolders,
		ignoredFolders: [],
	}),

	new Ssg('eleventy', {
		configPaths: ['eleventy.config.js', 'eleventy.config.cjs', '.eleventy.cjs'],
		templateExtensions: defaultTemplateExtensions.concat([
			'.njk',
			'.liquid',
			'.hbs',
			'.ejs',
			'.webc',
			'.mustache',
			'.haml',
			'.pug',
		]),
		contentExtensions: defaultContentExtensions,
		partialFolders: defaultIncludeFolders,
		ignoredFolders: [],
	}),

	new Ssg('sveltekit', {
		configPaths: ['svelte.config.js'],
		templateExtensions: defaultTemplateExtensions.concat(['.svelte']),
		contentExtensions: defaultContentExtensions.concat(['.svx']),
		partialFolders: defaultIncludeFolders,
		ignoredFolders: [
			'build/', // build output
			'.svelte-kit/', // cache
			'static/', // static assets
		],
	}),

	new Ssg('nextjs', {
		configPaths: ['next.config.js', 'next.config.mjs'],
		templateExtensions: defaultTemplateExtensions,
		contentExtensions: defaultContentExtensions,
		partialFolders: defaultIncludeFolders,
		ignoredFolders: [
			'out/', // build output
			'.next/', // cache
			'public/', // static assets
		],
	}),

	unknownSsg,
];

/**
 * Finds the most likely SSG for a set of files.
 *
 * @param filePaths {string[]}
 * @returns {Ssg}
 */
export function guessSsg(filePaths) {
	/** @type {Record<SsgKey, number>} */
	const scores = {
		eleventy: 0,
		jekyll: 0,
		bridgetown: 0,
		hugo: 0,
		sveltekit: 0,
		nextjs: 0,
		unknown: 0,
	};

	for (let i = 0; i < filePaths.length; i++) {
		for (let j = 0; j < ssgs.length; j++) {
			scores[ssgs[j].key] += ssgs[j].getPathScore(filePaths[i]);
		}
	}

	return ssgs.reduce(
		(previous, current) => (scores[previous.key] < scores[current.key] ? current : previous),
		unknownSsg,
	);
}
