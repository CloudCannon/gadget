import { test } from 'node:test';
import assert from 'node:assert';
import { findBasePath } from '../src/collections.ts';

test('finds base path', () => {
	assert.strictEqual(findBasePath(['src', 'src/_data', 'src/_includes', 'src/_includes/nav']), 'src');
	assert.strictEqual(findBasePath(['src']), '');
});
