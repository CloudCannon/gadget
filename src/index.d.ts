import { FileType } from './ssg.js';

interface FileSummary {
	filePath: string;
	type: FileType;
	collectionPaths?: string[];
}
