import { guessSsg, ssgs } from './ssgs/ssgs.js';
import { findBasePath } from './collections.js';
import { normalisePath } from './utility.js';

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
export async function generateConfiguration(filePaths, options) {
	const ssg = options?.buildConfig?.ssg
		? ssgs[options.buildConfig.ssg]
		: guessSsg(filterPaths(filePaths, options?.config?.source));

	const source = options?.config?.source ?? ssg.getSource(filePaths);
	filePaths = filterPaths(filePaths, source);

	const files = ssg.groupFiles(filePaths);

	const configFilePaths = files.groups.config.map((fileSummary) => fileSummary.filePath);
	const config = options?.readFile
		? await ssg.parseConfig(configFilePaths, options.readFile)
		: undefined;

	const collectionPaths = Object.keys(files.collectionPathCounts);

	return {
		ssg: ssg.key,
		config: {
			source,
			collections_config:
				options?.config?.collections_config ||
				ssg.sortCollectionsConfig(
					ssg.generateCollectionsConfig(collectionPaths, {
						source,
						config,
						basePath: findBasePath(collectionPaths),
						filePaths,
					}),
				),
			paths: options?.config?.paths ?? undefined,
			timezone: options?.config?.timezone ?? ssg.getTimezone(),
			markdown: options?.config?.markdown ?? ssg.generateMarkdown(config),
		},
	};
}

/**
 * Generates a baseline CloudCannon configuration based on the file path provided.
 *
 * @param filePaths {string[]} List of input file paths.
 * @param options {import('./types').GenerateOptions=} Options to aid generation.
 * @returns {Promise<import('./types').BuildCommands>}
 */
export async function generateBuildCommands(filePaths, options) {
	let source = options?.config?.source ? normalisePath(options.config.source) : undefined;

	const ssg = options?.buildConfig?.ssg
		? ssgs[options.buildConfig.ssg]
		: guessSsg(filterPaths(filePaths, source));

	source = source ?? ssg.getSource(filePaths);
	filePaths = filterPaths(filePaths, source);

	const files = ssg.groupFiles(filePaths);

	const configFilePaths = files.groups.config.map((fileSummary) => fileSummary.filePath);
	const config = options?.readFile
		? await ssg.parseConfig(configFilePaths, options.readFile)
		: undefined;

	return ssg.generateBuildCommands(filePaths, { config, source, readFile: options?.readFile });
}
