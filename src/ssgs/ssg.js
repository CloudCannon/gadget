import { extname } from 'path';
import { basename } from 'path';
import slugify from '@sindresorhus/slugify';
import titleize from 'titleize';
import { findIcon } from '../icons.js';
import { stripTopPath } from '../utility.js';

export default class Ssg {
	/** @type {import('@cloudcannon/configuration-types').SsgKey} */
	key;

	/**
	 * @param key {import('@cloudcannon/configuration-types').SsgKey | undefined=}
	 */
	constructor(key) {
		this.key = key || 'unknown';
	}

	/**
	 * @returns {string[]}
	 */
	configPaths() {
		return [];
	}

	/**
	 * @returns {string[]}
	 */
	templateExtensions() {
		return ['.htm', '.html'];
	}

	/**
	 * @returns {string[]}
	 */
	contentExtensions() {
		return [
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
	}

	/**
	 * @returns {string[]}
	 */
	partialFolders() {
		return [
			'layouts/', // general partials
			'components/', // general partials
			'component-library/', // general partials
			'schemas/', // CloudCannon schema files
		];
	}

	/**
	 * @returns {string[]}
	 */
	ignoredFolders() {
		return [
			'.git/',
			'.github/',
			'.cloudcannon/',
			'_cloudcannon/',
			'node_modules/',
			'.vscode/',
			'.zed/',
		];
	}

	/**
	 * @returns {string[]}
	 */
	ignoredFiles() {
		return [
			'.DS_Store',
			'.eslintrc.json',
			'tsconfig.json',
			'jsconfig.json',
			'.prettierrc.json',
			'package-lock.json',
			'package.json',
			'.gitignore',
			'README',
			'README.md',
			'LICENSE',
			'LICENSE.md',
			'cloudcannon.config.cjs',
			'cloudcannon.config.js',
			'cloudcannon.config.json',
			'cloudcannon.config.yml',
			'cloudcannon.config.yaml',
		];
	}

	/**
	 * Checks if the file at this path is an SSG configuration file.
	 *
	 * @param filePath {string}
	 * @returns {boolean}
	 */
	isConfigPath(filePath) {
		return this.configPaths().some(
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
		return (
			this.ignoredFolders().some(
				(folder) => filePath.startsWith(folder) || filePath.includes(`/${folder}`),
			) ||
			this.ignoredFiles().some((file) => filePath === file || filePath.endsWith(`/${file}`)) ||
			filePath.includes('.config.')
		);
	}

	/**
	 * Checks if the file at this path is a contains Markdown or structured content.
	 *
	 * @param filePath {string}
	 * @returns {boolean}
	 */
	isContentPath(filePath) {
		return this.contentExtensions().includes(extname(filePath));
	}

	/**
	 * Checks if the file at this path is an include, partial or layout file.
	 *
	 * @param filePath {string}
	 * @returns {boolean}
	 */
	isPartialPath(filePath) {
		return this.partialFolders().some(
			(partialFolder) =>
				filePath === partialFolder ||
				filePath.includes(`/${partialFolder}`) ||
				filePath.startsWith(partialFolder),
		);
	}

	/**
	 * Checks if the file at this path is a template file.
	 *
	 * @param filePath {string}
	 * @returns boolean
	 */
	isTemplatePath(filePath) {
		return this.templateExtensions().includes(extname(filePath));
	}

	/**
	 * Finds the likely type of the file at this path.
	 *
	 * @param filePath {string}
	 * @returns {import('../types').FileType}
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

		if (this.isContentPath(filePath)) {
			return 'content';
		}

		if (this.isTemplatePath(filePath)) {
			return 'template';
		}

		return 'other';
	}

	/**
	 * Attempts to find the most likely source folder.
	 *
	 * @param _files {import('../types').ParsedFiles}
	 * @param _filePaths {string[]} List of input file paths.
	 * @returns {string | undefined}
	 */
	getSource(_files, _filePaths) {
		return;
	}

	/**
	 * Generates a collection config entry.
	 *
	 * @param key {string}
	 * @param path {string}
	 * @param _basePath {string}
	 * @returns {import('@cloudcannon/configuration-types').CollectionConfig}
	 */
	generateCollectionConfig(key, path, _basePath) {
		const name = titleize(
			basename(path || key)
				.replace(/[_-]/g, ' ')
				.trim(),
		);

		return {
			path,
			name,
			icon: findIcon(name.toLowerCase()),
		};
	}

	/**
	 * Generates collections config from a set of paths.
	 *
	 * @param collectionPaths {{ basePath: string, paths: string[] }}
	 * @param source {string | undefined}
	 * @returns {import('../types').CollectionsConfig}
	 */
	generateCollectionsConfig(collectionPaths, source) {
		/** @type {import('../types').CollectionsConfig} */
		const collectionsConfig = {};
		const basePath = source
			? stripTopPath(collectionPaths.basePath, source)
			: collectionPaths.basePath;

		for (const fullPath of collectionPaths.paths) {
			const path = source ? stripTopPath(fullPath, source) : fullPath;
			const key = slugify(path, { separator: '_' }) || 'pages';

			collectionsConfig[key] = this.generateCollectionConfig(key, path, basePath);
		}

		return collectionsConfig;
	}
}
