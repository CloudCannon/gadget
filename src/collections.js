import { basename, join, sep } from 'path';
import { findIcon } from './icons.js';
import slugify from '@sindresorhus/slugify';
import titleize from 'titleize';

/**
 * Produces an ordered set of paths that a file at this path could belong to.
 *
 * @param filePath {string}
 * @returns {string[]}
 */
export function getCollectionPaths(filePath) {
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
 * Generates collections config from a set of paths.
 *
 * @param collectionPaths {{ basePath: string, paths: string[] }}
 * @returns {Record.<string, import('@cloudcannon/configuration-types').CollectionConfig>}
 */
export function generateCollectionsConfig(collectionPaths) {
	/** @type Record<string, import('@cloudcannon/configuration-types').CollectionConfig> */
	const collectionsConfig = {};

	for (let path of collectionPaths.paths) {
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

		console.log(path, collectionPaths.basePath);
		if (path === collectionPaths.basePath) {
			collectionsConfig[key].filter = {
				base: 'strict',
			};
		}
	}

	return collectionsConfig;
}

/**
 * Makes collection paths relative to a shared base path, also returns that shared path as source.
 *
 * @param collectionPathCounts {Record<string, number>}
 * @returns {{ basePath: string, paths: string[] }}
 */
export function processCollectionPaths(collectionPathCounts) {
	let paths = Object.keys(collectionPathCounts);
	let basePath = '';

	if (paths.length) {
		const checkParts = paths[0].split(sep);

		for (var i = 0; i < checkParts.length; i++) {
			const checkPath = join(...checkParts.slice(0, i));
			const isSharedPath = paths.every((pathKey) => pathKey.startsWith(checkPath + sep));

			if (isSharedPath) {
				basePath = checkPath;
			}
		}
	}

	if (basePath) {
		paths = paths.map((pathKey) => pathKey.substring(basePath.length + 1));
	}

	return {
		basePath,
		paths,
	};
}
