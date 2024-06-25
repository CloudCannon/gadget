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
