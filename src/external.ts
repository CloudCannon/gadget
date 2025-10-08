import type { Paths } from '@cloudcannon/configuration-types';
import { join, normalisePath, parseDataFile } from './utility';

export async function parseDecapConfigFile(
	filePaths: string[],
	readFile: ((path: string) => Promise<string | undefined>) | undefined
): Promise<Record<string, any> | undefined> {
	if (!readFile) {
		return;
	}

	// Decap config file is hosted, so can exist in many places.
	const configFilePaths = filePaths.filter((filePath) => filePath.endsWith('admin/config.yml'));
	if (configFilePaths.length === 1) {
		try {
			const config = await parseDataFile(configFilePaths[0], readFile);
			if (config) {
				return config;
			}
		} catch {
			// Intentionally ignored
		}
	}
}

export function getDecapPaths(decapConfig: Record<string, any> | undefined): Paths | undefined {
	const mediaFolder = normalisePath(decapConfig?.media_folder || '');
	if (mediaFolder) {
		const publicFolder = normalisePath(decapConfig?.public_folder || '') || mediaFolder;

		if (mediaFolder === publicFolder || mediaFolder.endsWith(`/${publicFolder}`)) {
			const staticPath = mediaFolder.substring(0, mediaFolder.length - publicFolder.length - 1);

			return {
				static: staticPath,
				uploads: join(staticPath, publicFolder),
			};
		}
	}
}
