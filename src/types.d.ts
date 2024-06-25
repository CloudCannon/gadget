import {
	type Configuration,
	type CollectionConfig,
	type SsgKey,
} from '@cloudcannon/configuration-types';

export type FileType = 'config' | 'content' | 'template' | 'partial' | 'ignored' | 'other';

export interface ParsedFile {
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
		source?: string;
	};
	/** Function to access the source contents a file. */
	readFile?: (path: string) => Promise<string>;
}

export interface ParsedFiles {
	groups: Record<FileType, ParsedFile[]>;
	collectionPathCounts: Record<string, number>;
}

export type CollectionsConfig = Record<string, CollectionConfig>;
