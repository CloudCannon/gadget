import { parse as tomlParse } from '@iarna/toml';
import htmlEntities from 'he';
import yaml from 'js-yaml';

/**
 * Retrieves the last element from an array.
 */
export function last<T>(array: T[]): T {
	return array[array.length - 1];
}

/**
 * Joins strings with slashes.
 */
export function joinPaths(paths: (string | undefined)[]): string {
	return normalisePath(paths.filter(Boolean).join('/'));
}

/**
 * Removes the first section of a path if it exists.
 */
export function stripTopPath(path: string, stripPath: string | undefined): string {
	stripPath = normalisePath(stripPath || '');
	if (path === stripPath) {
		return '';
	}

	if (!stripPath) {
		return path;
	}

	return path.startsWith(`${stripPath}/`) ? path.substring(stripPath.length + 1) : path;
}

/**
 * Removes the filename or last folder of a path if it exists.
 */
export function stripBottomPath(path: string): string {
	const index = path.lastIndexOf('/');
	return index > 0 ? path.substring(0, path.lastIndexOf('/')) : '';
}

/**
 * Removes duplicate, leading, and trailing slashes.
 */
export function normalisePath(path: string): string {
	return path.replace(/\/+/g, '/').replace(/^\//, '').replace(/\/$/, '');
}

/**
 * @throws {Error} When file fails to read or parse.
 */
export async function parseDataFile(
	path: string,
	readFile: (path: string) => Promise<string | undefined>
): Promise<Record<string, any> | undefined> {
	const lastDot = path.lastIndexOf('.');
	const extension = (lastDot < 0 ? '' : path.substring(lastDot + 1)).toLowerCase();
	if (!extension) {
		return;
	}

	const parsers: Record<string, (contents: string) => unknown> = {
		yml: yaml.load,
		yaml: yaml.load,
		json: JSON.parse,
		toml: tomlParse,
	};

	const parser = parsers[extension];
	if (!parser) {
		return;
	}

	const fileContents = await readFile(path);
	if (!fileContents) {
		return;
	}

	const contents = parser(fileContents);
	if (contents && typeof contents === 'object') {
		return contents;
	}
}

export function decodeEntity(entityString: string): string {
	if (entityString.length === 1) {
		// assumed already decoded
		return entityString;
	}

	// Jekyll config has entities without & or ;
	const entity = `&${entityString};`.replace(/^&&/, '&').replace(/;;$/, ';');
	return htmlEntities.decode(entity);
}
