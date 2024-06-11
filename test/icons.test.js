import test from 'ava';
import { findIcon } from '../src/icons.js';

test('finds an icon', (t) => {
	t.is(findIcon('motels'), 'hotel');
	t.is(findIcon('authors'), 'anchor');
});

test('finds an icon by override', (t) => {
	t.is(findIcon('pages'), 'wysiwyg');
});
