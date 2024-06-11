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
