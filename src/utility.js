import yaml from 'js-yaml';
import { parse as tomlParse } from '@iarna/toml';
import htmlEntities from 'he';

/**
 * Retrieves the last element from an array.
 *
 * @template T
 * @param array {Array<T>}
 * @returns {T | undefined}
 */
export function last(array) {
	return array[array.length - 1];
}

/**
 * Joins strings with slashes.
 * 
 * @param {string[]} paths 
 */
export function joinPaths(paths) {
	return paths.join('/').replace(/\/\//g, '/');
}

/**
 * Removes the first section of a path if it exists.
 *
 * @param path {string}
 * @param stripPath {string}
 * @returns {string}
 */
export function stripTopPath(path, stripPath) {
	if (path === stripPath) {
		return '';
	}

	return path.startsWith(`${stripPath}/`) ? path.substring(stripPath.length + 1) : path;
}

/**
 * @param path {string}
 * @param readFile {(path: string) => Promise<string>}
 * @returns {Promise<Record<string, any> | null>}
 */
export async function parseDataFile(path, readFile) {
	const lastDot = path.lastIndexOf('.');
	const extension = (lastDot < 0 ? '' : path.substring(lastDot + 1)).toLowerCase();
	if (!extension) {
		return null;
	}
	
	try {
		const fileContents = await readFile(path);
		if (!fileContents) {
			return null;
		}
		let contents;
		if (['yml', 'yaml'].includes(extension)) {
			contents = yaml.load(fileContents);
		}
		if (extension === 'json') {
			contents = JSON.parse(fileContents);
		}
		if (extension === 'toml') {
			contents = tomlParse(fileContents);	
		}
		if (contents && typeof contents === 'object') {
			return contents;
		}

	} catch (e) {
		console.warn(e);
	}

	return null;
}

/**
 * @param entityString {string}
 * @returns {string}
 */
export function decodeEntity(entityString) {
    if (entityString.length === 1) {
        // assumed already decoded
        return entityString;
    }
    const entity = `&${entityString};`
        .replace(/^&&/, '&')
        .replace(/;;$/, ';'); // Jekyll config has entities without & or ;
    return htmlEntities.decode(entity);
}