export type FileType = 'config' | 'content' | 'template' | 'partial' | 'ignored' | 'other';

export type SsgKey =
	| 'jekyll'
	| 'bridgetown'
	| 'eleventy'
	| 'hugo'
	| 'sveltekit'
	| 'nextjs'
	| 'unknown';

interface FileSummary {
	filePath: string;
	type: FileType;
	collectionPaths?: string[];
}

interface GenerateOptions {
	/** Custom user configuration. */
	userConfig?: Record<string, any>;
	/** SSG-specific build configuration. */
	buildConfig?: Record<string, any>;
	/** Function to access the source contents a file. */
	readFile?: (path: string) => Promise<string>;
}
