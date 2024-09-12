import {
	type Configuration,
	type CollectionConfig,
	type SsgKey,
} from '@cloudcannon/configuration-types';

export type FileType = 'config' | 'content' | 'template' | 'partial' | 'ignored' | 'other';

export interface FileSummary {
	filePath: string;
	type: FileType;
	collectionPaths?: string[];
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
}

export interface GroupedFileSummaries {
	groups: Record<FileType, FileSummary[]>;
	collectionPathCounts: Record<string, number>;
}

export type CollectionsConfig = Record<string, CollectionConfig>;

export interface BuildCommandSuggestion {
	value: string;
	/** Describes why this build suggestion was made */
	attribution: string;
}

export interface BuildCommands {
	install: BuildCommandSuggestion[];
	build: BuildCommandSuggestion[];
	output: BuildCommandSuggestion[];
	environment: Record<string, BuildCommandSuggestion>;
	preserved: BuildCommandSuggestion[];
}

export interface GenerateCollectionsConfigOptions {
	config?: Record<string, any>;
	source?: string;
	basePath: string;
	filePaths: string[];
}

export interface GenerateCollectionConfigOptions extends GenerateCollectionsConfigOptions {
	collectionPaths: string[];
}

export interface GenerateCollectionConfigOptionsJekyll extends GenerateCollectionConfigOptions {
	/** The matching Jekyll collection from _config.yml */
	collection: Record<string, any> | undefined;
}
