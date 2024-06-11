import test from 'ava';
import { processCollectionPaths } from '../src/collections.js';

test('processes collection paths', (t) => {
	const processed = processCollectionPaths({
		src: 1,
		'src/_data': 3,
		'src/_includes': 3,
		'src/_includes/nav': 2,
	});

	t.deepEqual(processed, {
		basePath: 'src',
		paths: ['', '_data', '_includes', '_includes/nav'],
	});
});
