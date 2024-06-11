export type FileType = 'config' | 'content' | 'template' | 'partial' | 'ignored' | 'other';

export type SsgKey =
	| 'jekyll'
	| 'bridgetown'
	| 'eleventy'
	| 'hugo'
	| 'sveltekit'
	| 'nextjs'
	| 'unknown';

export interface ParsedFile {
	filePath: string;
	type: FileType;
	collectionPaths?: string[];
}

export interface GenerateOptions {
	/** Custom user configuration. */
	userConfig?: {
		source?: string;
	};
	/** SSG-specific build configuration. */
	buildConfig?: {
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
