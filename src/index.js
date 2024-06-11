import { guessSsg } from './ssg.js';
import { last } from './utility.js';
import {
	getCollectionPaths,
	generateCollectionsConfig,
	processCollectionPaths,
} from './collections.js';

/**
 * Provides a summary of a file at this path.
 *
 * @param filePath {string}
 * @param ssg {import('./ssg.js').Ssg}
 * @returns {import('./types.d.ts').FileSummary}
 */
function generateFile(filePath, ssg) {
	const type = ssg.getFileType(filePath);

	return {
		filePath,
		type,
	};
}

/**
 * Generates a baseline CLoudCannon configuration based on the file path provided.
 *
 * @param filePaths {string[]} List of input file paths.
 * @param _options {import('./types.d.ts').GenerateOptions=} Options to aid generation.
 * @returns {Promise<import('@cloudcannon/configuration-types').Configuration>}
 */
export async function generate(filePaths, _options) {
	const ssg = guessSsg(filePaths);

	/** @type {Record<string, number>} */
	const collectionPathCounts = {};

	/** @type {Record<import('./types.d.ts').FileType, import('./types.d.ts').FileSummary[]>} */
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

	const collectionPaths = processCollectionPaths(collectionPathCounts);
	console.log('collectionPaths', collectionPaths);

	return {
		source: '',
		collections_config: generateCollectionsConfig(collectionPaths),
		paths: {
			collections: collectionPaths.basePath,
		},
	};
}
