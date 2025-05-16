import test from 'ava';
import { findIcon } from '../src/icons.js';

test('finds an icon', (t) => {
	t.is(findIcon('motels'), 'hotel');
	t.is(findIcon('dragons'), 'dialogs');
});

test('finds an icon by override', (t) => {
	t.is(findIcon('pages'), 'wysiwyg');
});
