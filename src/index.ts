import type { Configuration, SsgKey } from '@cloudcannon/configuration-types';
import { findBasePath } from './collections.ts';
import { parseDecapConfigFile } from './external.ts';
import type Ssg from './ssgs/ssg.ts';
import type { BuildCommandSuggestion, BuildCommands, CollectionConfigTree } from './ssgs/ssg.ts';
import { guessSsg, ssgs } from './ssgs/ssgs.ts';
import { normalisePath } from './utility.ts';

export { ssgs } from './ssgs/ssgs.ts';
export type { BuildCommandSuggestion, BuildCommands, CollectionConfigTree, Configuration, SsgKey };

export interface ExternalConfig {
	decap: Record<string, any> | undefined;
}

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
	/** Tree for selectively creating a collections_config. */
	collections: CollectionConfigTree[];
}

/**
 * Filters out file paths not in the provided source.
 */
function filterPathsInSource(filePaths: string[], source: string | undefined): string[] {
	source === '/' ? '' : source;
	return source ? filePaths.filter((filePath) => filePath.startsWith(source)) : filePaths;
}

/**
 * Filters out ignored file paths.
 */
function filterPathsIgnored(filePaths: string[], ssg: Ssg): string[] {
	return filePaths.filter(
		(filePath) => !ssg.isInIgnoredFolder(filePath) && !ssg.isIgnoredFile(filePath)
	);
}

function ensureOptions(
	filePaths: string[],
	options: { ssg?: SsgKey; source?: string }
): {
	ssg: Ssg;
	filteredFilePaths: string[];
	source: string;
} {
	let ssg = options?.ssg ? ssgs[options.ssg] : undefined;

	if (!ssg) {
		const source = normalisePath(options?.source ?? '');
		// other is the base Ssg definition, so we ignore folders like node_modules and .git
		const nonIgnoredFilePaths = filterPathsIgnored(filePaths, ssgs.other);
		const filteredFilePaths = filterPathsInSource(nonIgnoredFilePaths, source);

		ssg = guessSsg(filteredFilePaths);

		if (ssg.key === 'other') {
			return {
				ssg,
				filteredFilePaths,
				source,
			};
		}
	}

	const nonIgnoredFilePaths = filterPathsIgnored(filePaths, ssg);
	const source = normalisePath(options?.source ?? ssg.getSource(filePaths) ?? '');
	const filteredFilePaths = filterPathsInSource(nonIgnoredFilePaths, source);

	return {
		ssg,
		filteredFilePaths,
		source,
	};
}

/**
 * Generates a baseline CloudCannon configuration based on the file path provided.
 */
export async function generateConfiguration(
	filePaths: string[],
	options?: GenerateOptions
): Promise<GenerateResult> {
	const { ssg, filteredFilePaths, source } = ensureOptions(filePaths, {
		ssg: options?.buildConfig?.ssg,
		source: options?.config?.source,
	});

	const files = ssg.groupFiles(filteredFilePaths);

	const configFilePaths = files.groups.config.map((fileSummary) => fileSummary.filePath);
	const ssgConfig = options?.readFile
		? await ssg.parseConfig(configFilePaths, options.readFile)
		: undefined;

	const collectionPaths = Object.keys(files.collectionPathCounts);

	const externalConfig: ExternalConfig = {
		decap: await parseDecapConfigFile(filteredFilePaths, options?.readFile),
	};

	const configuration: Configuration = {
		paths: options?.config?.paths ?? ssg.getPaths(externalConfig),
		timezone: options?.config?.timezone ?? ssg.getTimezone(),
		markdown: options?.config?.markdown ?? ssg.generateMarkdown(ssgConfig),
	};

	if (source) {
		configuration.source = source;
	}

	const snippetsImports = options?.config?._snippets_imports ?? ssg.getSnippetsImports();
	if (snippetsImports) {
		configuration._snippets_imports = snippetsImports;
	}

	return {
		ssg: ssg.key,
		config: configuration,
		collections: ssg.generateCollectionsConfigTree(collectionPaths, {
			config: options?.config,
			source,
			ssgConfig,
			basePath: findBasePath(collectionPaths),
			filePaths: filteredFilePaths,
			externalConfig,
		}),
	};
}

/**
 * Generates a baseline CloudCannon configuration based on the file path provided.
 */
export async function generateBuildCommands(
	filePaths: string[],
	options?: GenerateOptions
): Promise<BuildCommands> {
	const { ssg, filteredFilePaths, source } = ensureOptions(filePaths, {
		ssg: options?.buildConfig?.ssg,
		source: options?.config?.source,
	});

	const files = ssg.groupFiles(filteredFilePaths);
	const configFilePaths = files.groups.config.map((fileSummary) => fileSummary.filePath);
	const config = options?.readFile
		? await ssg.parseConfig(configFilePaths, options.readFile)
		: undefined;

	return ssg.generateBuildCommands(filteredFilePaths, {
		config,
		source,
		readFile: options?.readFile,
	});
}
