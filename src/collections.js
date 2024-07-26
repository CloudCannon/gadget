import { join } from 'path';
import { stripTopPath } from './utility.js';

/**
 * Produces an ordered set of paths that a file at this path could belong to.
 *
 * @param filePath {string}
 * @returns {string[]}
 */
export function getCollectionPaths(filePath) {
	let builder = '';
	const paths = [''];
	const parts = filePath.split('/');

	for (var i = 0; i < parts.length - 1; i++) {
		builder = join(builder, parts[i]);
		paths.push(builder);
	}

	return paths;
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
		const checkParts = paths[0].split('/');

		for (var i = 0; i < checkParts.length; i++) {
			const checkPath = join(...checkParts.slice(0, i + 1));

			const isSharedPath =
				checkPath &&
				paths.every((pathKey) => pathKey === checkPath || pathKey.startsWith(checkPath + '/'));

			if (isSharedPath) {
				basePath = checkPath;
			}
		}
	}

	if (basePath) {
		paths = paths.map((pathKey) => stripTopPath(pathKey, basePath));
	}

	return {
		basePath,
		paths,
	};
}
