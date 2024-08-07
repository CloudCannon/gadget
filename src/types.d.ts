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
	readFile?: (path: string) => Promise<string>;
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
