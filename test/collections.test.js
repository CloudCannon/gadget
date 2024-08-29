import test from 'ava';
import { findBasePath } from '../src/collections.js';

test('processes collection paths', (t) => {
	const processed = findBasePath(['src', 'src/_data', 'src/_includes', 'src/_includes/nav']);
	t.deepEqual(processed, 'src');
});
