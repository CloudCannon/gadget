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
 * @param {(string | undefined)[]} paths
 */
export function joinPaths(paths) {
	return normalisePath(paths.filter(Boolean).join('/'));
}

/**
 * Removes the first section of a path if it exists.
 *
 * @param path {string}
 * @param stripPath {string | undefined}
 * @returns {string}
 */
export function stripTopPath(path, stripPath) {
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
 *
 * @param path {string}
 * @returns {string}
 */
export function popPathSection(path) {
	const index = path.lastIndexOf('/');
	return index > 0 ? path.substring(path.lastIndexOf('/')) : '';
}

/**
 * Removes duplicate, leading, and trailing slashes.
 *
 * @param path {string}
 * @returns {string}
 */
export function normalisePath(path) {
	return path.replace(/\/+/g, '/').replace(/^\//, '').replace(/\/$/, '');
}

/**
 * @param path {string}
 * @param readFile {(path: string) => Promise<string | undefined>}
 * @returns {Promise<Record<string, any> | undefined>}
 * @throws {Error} When file fails to read or parse.
 */
export async function parseDataFile(path, readFile) {
	const lastDot = path.lastIndexOf('.');
	const extension = (lastDot < 0 ? '' : path.substring(lastDot + 1)).toLowerCase();
	if (!extension) {
		return;
	}

	/** @type {Record<string, (contents: string) => unknown>} */
	const parsers = {
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

/**
 * @param entityString {string}
 * @returns {string}
 */
export function decodeEntity(entityString) {
	if (entityString.length === 1) {
		// assumed already decoded
		return entityString;
	}

	// Jekyll config has entities without & or ;
	const entity = `&${entityString};`.replace(/^&&/, '&').replace(/;;$/, ';');
	return htmlEntities.decode(entity);
}
