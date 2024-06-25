import { guessSsg, ssgs } from './ssgs/ssgs.js';
import { last, stripTopPath } from './utility.js';
import {
	getCollectionPaths,
	generateCollectionsConfig,
	processCollectionPaths,
} from './collections.js';

/**
 * Provides a summary of a file at this path.
 *
 * @param filePath {string} The input file path.
 * @param ssg {import('./ssgs/ssg').default} The associated SSG.
 * @returns {import('./types').ParsedFile} Summary of the file.
 */
function parseFile(filePath, ssg) {
	const type = ssg.getFileType(filePath);

	return {
		filePath,
		type,
	};
}

/**
 * Provides a summary of files.
 *
 * @param filePaths {string[]} The input file path.
 * @param ssg {import('./ssgs/ssg').default} The associated SSG.
 * @param source {string} The site's source path.
 * @returns {import('./types').ParsedFiles} The file summaries grouped by type.
 */
function parseFiles(filePaths, ssg) {
	/** @type {Record<string, number>} */
	const collectionPathCounts = {};

	/** @type {Record<import('./types').FileType, import('./types').ParsedFile[]>} */
	const groups = {
		config: [],
		content: [],
		partial: [],
		other: [],
		template: [],
		ignored: [],
	};

	for (let i = 0; i < filePaths.length; i++) {
		const file = parseFile(filePaths[i], ssg);

		if (file.type === 'content') {
			const lastPath = last(getCollectionPaths(filePaths[i]));
			if (lastPath || lastPath === '') {
				collectionPathCounts[lastPath] = collectionPathCounts[lastPath] || 0;
				collectionPathCounts[lastPath] += 1;
			}
		}

		if (file.type !== 'ignored') {
			groups[file.type].push(file);
		}
	}

	return { collectionPathCounts, groups };
}

/**
 * Generates a baseline CloudCannon configuration based on the file path provided.
 *
 * @param filePaths {string[]} List of input file paths.
 * @param options {import('./types').GenerateOptions=} Options to aid generation.
 * @returns {Promise<import('@cloudcannon/configuration-types').Configuration>}
 */
export async function generate(filePaths, options) {
	const ssgKey = options?.config?.ssg ?? options?.buildConfig?.ssg;
	const ssg = ssgKey ? ssgs[ssgKey] : guessSsg(filePaths);
	const files = parseFiles(filePaths, ssg);
	const collectionPaths = processCollectionPaths(files.collectionPathCounts);

	const source =
		options?.config?.source ??
		options?.buildConfig?.source ??
		ssg.getSource(files, filePaths, collectionPaths);

	const collectionsConfig =
		options?.config?.collections_config ?? generateCollectionsConfig(collectionPaths, source);

	return {
		ssg: ssg?.key,
		source,
		collections_config: collectionsConfig,
		paths: {
			collections: stripTopPath(collectionPaths.basePath, source),
			...options?.config?.paths,
		},
	};
}
