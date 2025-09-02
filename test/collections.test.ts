import { expect, it } from 'vitest';
import { findBasePath } from '../src/collections';

it('finds base path', () => {
	expect(findBasePath(['src', 'src/_data', 'src/_includes', 'src/_includes/nav'])).toBe('src');
	expect(findBasePath(['src'])).toBe('');
});
