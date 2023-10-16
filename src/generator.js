import { fdir } from 'fdir';
import { basename, join, sep } from 'path';
import { icons } from './icons.js';
import slugify from '@sindresorhus/slugify';
import titleize from 'titleize';
import leven from 'leven';
import { guessSsg } from './ssg.js';

/**
 * Produces an ordered set of paths that a file at this path could belong to.
 *
 * @param filePath {string}
 * @returns {Array<string>}
 */
function getCollectionPaths(filePath) {
	let builder = '';
	const paths = [''];
	const parts = filePath.split(sep);

	for (var i = 0; i < parts.length - 1; i++) {
		builder = join(builder, parts[i]);
		paths.push(builder);
	}

	return paths;
}

/**
 * Finds an icon closest to the query provided.
 *
 * @param query {string}
 * @returns {import('@cloudcannon/configuration-types').Icon}
 */
function findIcon(query) {
	return icons.reduce((previous, current) =>
		leven(query, current) < leven(query, previous) ? current : previous,
	);
}

/**
 * Generates collections config from a set of paths.
 *
 * @param collectionPaths {string[]}
 * @returns {Object.<string, import('@cloudcannon/configuration-types').CollectionConfig>}
 */
function generateCollectionsConfig(collectionPaths) {
	/** @type Object<string, import('@cloudcannon/configuration-types').CollectionConfig> */
	const collectionsConfig = {};

	for (let path of collectionPaths) {
		const key = slugify(path) || 'pages';
		const name = titleize(
			basename(path || key)
				.replace(/[_-]/g, ' ')
				.trim(),
		);

		collectionsConfig[key] = {
			path,
			name,
			icon: findIcon(name.toLowerCase()),
		};
	}

	return collectionsConfig;
}

/**
 * Retrieves the last element from an array.
 *
 * @template T
 * @param array {Array<T>}
 * @returns {T | undefined}
 */
function last(array) {
	return array[array.length - 1];
}

/**
 * Provides a summary of a file at this path.
 *
 * @param filePath {string}
 * @param ssg {import('./ssg.js').Ssg}
 * @returns {import('./index.js').FileSummary}
 */
function generateFile(filePath, ssg) {
	const type = ssg.getFileType(filePath);

	return {
		filePath,
		type,
	};
}

/**
 * Checks if we should skip a file at this path.
 *
 * @param filePath {string}
 * @returns {boolean}
 */
function isIgnoredPath(filePath) {
	return (
		filePath.startsWith('.git/') ||
		filePath === '.gitignore' ||
		filePath.startsWith('.github/') ||
		filePath.startsWith('.cloudcannon/') ||
		filePath.startsWith('_cloudcannon/') ||
		filePath.startsWith('cloudcannon.config.') ||
		filePath.startsWith('node_modules/') ||
		filePath.includes('/node_modules/') ||
		filePath === 'README.md' ||
		filePath === 'LICENSE' ||
		filePath.endsWith('.DS_Store') ||
		filePath.endsWith('.eslintrc.json') ||
		filePath.endsWith('tsconfig.json') ||
		filePath.endsWith('jsconfig.json') ||
		filePath.endsWith('.prettierrc.json') ||
		filePath.endsWith('package-lock.json') ||
		filePath.endsWith('package.json')
	);
}

/**
 * Makes collection paths relative to a shared base path, also returns that shared path as source.
 *
 * @param collectionPathCounts {Record<string, number>}
 * @returns {{ source: string, collectionPaths: string[] }}
 */
function processCollectionPaths(collectionPathCounts) {
	let paths = Object.keys(collectionPathCounts);
	let sharedBasePath = '';

	if (paths.length) {
		const checkParts = paths[0].split(sep);

		for (var i = 0; i < checkParts.length; i++) {
			const checkPath = join(...checkParts.slice(0, i));
			const isSharedPath = paths.every((pathKey) => pathKey.startsWith(checkPath + sep));

			if (isSharedPath) {
				sharedBasePath = checkPath;
			}
		}
	}

	if (sharedBasePath) {
		paths = paths.map((pathKey) => pathKey.substring(sharedBasePath.length + 1));
	}

	return {
		source: sharedBasePath, // TODO: this is really a collections path instead of the site source, should calculate it better
		collectionPaths: paths,
	};
}

/**
 * Generates a baseline configuration based on the files within the given folder.
 *
 * @param folderPath {string}
 * @returns {Promise<import('@cloudcannon/configuration-types').Configuration>}
 */
export async function generate(folderPath) {
	const crawler = new fdir().withRelativePaths().filter((filePath) => !isIgnoredPath(filePath));
	const filePaths = await crawler.crawl(folderPath).withPromise();
	const ssg = guessSsg(filePaths);

	/** @type {Record<string, number>} */
	const collectionPathCounts = {};

	/** @type {Record<import('./ssg.js').FileType, import('./index.js').FileSummary[]>} */
	const files = {
		config: [],
		content: [],
		partial: [],
		other: [],
		template: [],
		ignored: [],
	};

	for (let i = 0; i < filePaths.length; i++) {
		const file = generateFile(filePaths[i], ssg);

		if (file.type === 'content') {
			const lastPath = last(getCollectionPaths(filePaths[i]));
			if (lastPath || lastPath === '') {
				collectionPathCounts[lastPath] = collectionPathCounts[lastPath] || 0;
				collectionPathCounts[lastPath] += 1;
			}
		}

		if (file.type !== 'ignored') {
			files[file.type].push(file);
		}
	}

	const { source, collectionPaths } = processCollectionPaths(collectionPathCounts);

	return {
		source,
		collections_config: generateCollectionsConfig(collectionPaths),
	};
}
