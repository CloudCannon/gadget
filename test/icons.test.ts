import { expect, it } from 'vitest';
import { findIcon } from '../src/icons';

it('finds an icon', () => {
	expect(findIcon('motels')).toBe('hotel');
	expect(findIcon('dragons')).toBe('dialogs');
});

it('finds an icon by override', () => {
	expect(findIcon('pages')).toBe('wysiwyg');
});
