import assert from 'node:assert';
import { test } from 'node:test';
import { findIcon } from '../src/icons.ts';

test('finds an icon', () => {
	assert.strictEqual(findIcon('motels'), 'hotel');
	assert.strictEqual(findIcon('dragons'), 'dialogs');
});

test('finds an icon by override', () => {
	assert.strictEqual(findIcon('pages'), 'wysiwyg');
});
