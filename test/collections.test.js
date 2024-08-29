import test from 'ava';
import { findBasePath } from '../src/collections.js';

test('finds base path', (t) => {
	t.deepEqual(findBasePath(['src', 'src/_data', 'src/_includes', 'src/_includes/nav']), 'src');
	t.deepEqual(findBasePath(['src']), '');
});
