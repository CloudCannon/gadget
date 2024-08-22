import { guessSsg, ssgs } from './ssgs/ssgs.js';
import { processCollectionPaths } from './collections.js';

export { ssgs } from './ssgs/ssgs.js';

/**
 * Filters out file paths not in the provided source.
 *
 * @param filePaths {string[]} List of input file paths.
 * @param source {string | undefined} The source path.
 */
function filterPaths(filePaths, source) {
	source = `${source || ''}/`.replace(/\/+/, '/').replace(/^\//, '');
	source = source === '/' ? '' : source;

	if (!source) {
		return filePaths;
	}

	return filePaths.filter((filePath) => filePath.startsWith(source));
}

/**
 * Generates a baseline CloudCannon configuration based on the file path provided.
 *
 * @param filePaths {string[]} List of input file paths.
 * @param options {import('./types').GenerateOptions=} Options to aid generation.
 * @returns {Promise<import('./types').GenerateResult>}
 */
export async function generate(filePaths, options) {
	const ssg = options?.buildConfig?.ssg
		? ssgs[options.buildConfig.ssg]
		: guessSsg(filterPaths(filePaths, options?.config?.source));

	const source = options?.config?.source ?? ssg.getSource(filePaths);
	filePaths = filterPaths(filePaths, source);

	const files = ssg.groupFiles(filePaths);
	const collectionPaths = processCollectionPaths(files.collectionPathCounts);
	const collectionsConfig =
		options?.config?.collections_config || ssg.generateCollectionsConfig(collectionPaths, source);

	let markdownConfig;
	if (options?.readFile) {
		const config = await ssg.parseConfig(filePaths, options?.readFile);
		if (config) {
			markdownConfig = await ssg.generateMarkdownConfig(config);
		}
	}

	return {
		ssg: ssg.key,
		config: {
			source,
			collections_config: collectionsConfig,
			paths: options?.config?.paths ?? undefined,
			timezone: options?.config?.timezone ?? ssg.getTimezone(),
			markdown: markdownConfig
		},
	};
}
