import { join } from './utility.ts';

/**
 * Produces an ordered set of paths that a file at this path could belong to.
 */
export function getCollectionPaths(filePath: string): string[] {
	let builder = '';
	const paths = [''];
	const parts = filePath.split('/');

	for (let i = 0; i < parts.length - 1; i++) {
		builder = join(builder, parts[i]);
		paths.push(builder);
	}

	return paths;
}

/**
 * Finds a shared base path.
 */
export function findBasePath(paths: string[]): string {
	let basePath = '';

	if (paths.length > 1) {
		const checkParts = paths[0].split('/');

		for (let i = 0; i < checkParts.length; i++) {
			const checkPath = join(...checkParts.slice(0, i + 1));

			const isSharedPath =
				checkPath &&
				paths.every((pathKey) => pathKey === checkPath || pathKey.startsWith(`${checkPath}/`));

			if (isSharedPath) {
				basePath = checkPath;
			}
		}
	}

	return basePath;
}
