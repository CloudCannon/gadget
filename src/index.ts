import type { Configuration, SsgKey } from '@cloudcannon/configuration-types';
import { findBasePath } from './collections';
import type { BuildCommands } from './ssgs/ssg';
import { guessSsg, ssgs } from './ssgs/ssgs';
import { normalisePath } from './utility';

export { ssgs } from './ssgs/ssgs';

export interface GenerateOptions {
	/** Current configuration, or user overrides for generation. */
	config?: Configuration;
	/** Build configuration, most likely the parsed CLI options for specific SSGs. */
	buildConfig?: {
		ssg?: SsgKey;
	};
	/** Function to access the source contents a file. */
	readFile?: (path: string) => Promise<string | undefined>;
}

export interface GenerateResult {
	/** Identifies what SSG was used during config generation. */
	ssg: SsgKey | undefined;
	/** The generated configuration. */
	config: Configuration;
}

/**
 * Filters out file paths not in the provided source.
 */
function filterPaths(filePaths: string[], source: string | undefined): string[] {
	source = `${normalisePath(source || '')}/`;
	source = source === '/' ? '' : source;

	if (!source) {
		return filePaths;
	}

	return filePaths.filter((filePath) => filePath.startsWith(source));
}

/**
 * Generates a baseline CloudCannon configuration based on the file path provided.
 */
export async function generateConfiguration(
	filePaths: string[],
	options?: GenerateOptions
): Promise<GenerateResult> {
	const ssg =
		options?.buildConfig?.ssg && ssgs[options.buildConfig.ssg]
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
					})
				),
			paths: options?.config?.paths ?? ssg.getPaths(),
			timezone: options?.config?.timezone ?? ssg.getTimezone(),
			markdown: options?.config?.markdown ?? ssg.generateMarkdown(config),
			_snippets_imports: options?.config?._snippets_imports ?? ssg.getSnippetsImports(),
		},
	};
}

/**
 * Generates a baseline CloudCannon configuration based on the file path provided.
 */
export async function generateBuildCommands(
	filePaths: string[],
	options?: GenerateOptions
): Promise<BuildCommands> {
	let source = options?.config?.source ? normalisePath(options.config.source) : undefined;

	const ssg = options?.buildConfig?.ssg
		? ssgs[options.buildConfig.ssg]
		: guessSsg(filterPaths(filePaths, source));

	source = source ?? ssg.getSource(filePaths);

	const files = ssg.groupFiles(filePaths);

	const configFilePaths = files.groups.config.map((fileSummary) => fileSummary.filePath);
	const config = options?.readFile
		? await ssg.parseConfig(configFilePaths, options.readFile)
		: undefined;

	return ssg.generateBuildCommands(filePaths, { config, source, readFile: options?.readFile });
}
