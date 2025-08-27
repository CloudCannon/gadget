import { expect, it } from 'vitest';
import { findBasePath } from '../src/collections';

it('finds base path', () => {
	expect(findBasePath(['src', 'src/_data', 'src/_includes', 'src/_includes/nav'])).toEqual('src');
	expect(findBasePath(['src'])).toEqual('');
});
