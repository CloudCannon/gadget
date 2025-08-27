import { expect, it } from 'vitest';
import { decodeEntity, joinPaths, last, stripBottomPath, stripTopPath } from '../src/utility';

it('gets last element', () => {
	expect(last(['first', 'final'])).toBe('final');
	expect(last(['first'])).toBe('first');
	expect(last([])).toBe(undefined);
});

it('joins paths', () => {
	expect(joinPaths(['first'])).toBe('first');
	expect(joinPaths(['first', 'final'])).toBe('first/final');
	expect(joinPaths(['/first/', '//fi///nal'])).toBe('first/fi/nal');
	expect(joinPaths([])).toBe('');
});

it('strips top path', () => {
	expect(stripTopPath('src/content/index.html', 'src')).toBe('content/index.html');
	expect(stripTopPath('src/content/index.html', 'src/')).toBe('content/index.html');
	expect(stripTopPath('src/content/index.html', '/src')).toBe('content/index.html');
	expect(stripTopPath('src/content/index.html', '/src/')).toBe('content/index.html');
	expect(stripTopPath('src/content/index.html', '/src/')).toBe('content/index.html');
	expect(stripTopPath('src/index.html', 'src')).toBe('index.html');
	expect(stripTopPath('src/index.html', '')).toBe('src/index.html');
	expect(stripTopPath('src', 'src')).toBe('');
	expect(stripTopPath('src', '/src/')).toBe('');
	expect(stripTopPath('src', '')).toBe('src');

	expect(stripTopPath('sauce/content', 'sauce')).toBe('content');
});

it('strips bottom path', () => {
	expect(stripBottomPath('src/content/index.html')).toBe('src/content');
	expect(stripBottomPath('src/content')).toBe('src');
	expect(stripBottomPath('src')).toBe('');
	expect(stripBottomPath('')).toBe('');
});

it('decodes entities', () => {
	expect(decodeEntity('&amp;')).toBe('&');
	expect(decodeEntity('&copy;')).toBe('©');
	expect(decodeEntity('&lsquo;')).toBe('‘');
	expect(decodeEntity('&rsquo;')).toBe('’');
	expect(decodeEntity('&ldquo;')).toBe('“');
	expect(decodeEntity('&rdquo;')).toBe('”');

	expect(decodeEntity('&')).toBe('&');
	expect(decodeEntity('a')).toBe('a');
});
