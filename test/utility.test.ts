import assert from 'node:assert';
import { test } from 'node:test';
import {
	basename,
	decodeEntity,
	extname,
	join,
	last,
	stripBottomPath,
	stripTopPath,
} from '../src/utility.ts';

test('gets extname', () => {
	assert.strictEqual(extname(''), '');
	assert.strictEqual(extname('file.md'), '.md');
	assert.strictEqual(extname('folder/file.md'), '.md');
	assert.strictEqual(extname('folder/file'), '');
	assert.strictEqual(extname('folder/.file'), '');
});

test('gets basename', () => {
	assert.strictEqual(basename(''), '');
	assert.strictEqual(basename('first'), 'first');
	assert.strictEqual(basename('/first'), 'first');
	assert.strictEqual(basename('/first/'), 'first');
	assert.strictEqual(basename('first/'), 'first');
	assert.strictEqual(basename('first/second'), 'second');
	assert.strictEqual(basename('/first/second'), 'second');
	assert.strictEqual(basename('/first/second/'), 'second');
	assert.strictEqual(basename('first/second/'), 'second');
});

test('gets last element', () => {
	assert.strictEqual(last(['first', 'final']), 'final');
	assert.strictEqual(last(['first']), 'first');
	assert.strictEqual(last([]), undefined);
});

test('joins paths', () => {
	assert.strictEqual(join('first'), 'first');
	assert.strictEqual(join('first', 'final'), 'first/final');
	assert.strictEqual(join('/first/', '//fi///nal'), 'first/fi/nal');
	assert.strictEqual(join(), '');
});

test('strips top path', () => {
	assert.strictEqual(stripTopPath('src/content/index.html', 'src'), 'content/index.html');
	assert.strictEqual(stripTopPath('src/content/index.html', 'src/'), 'content/index.html');
	assert.strictEqual(stripTopPath('src/content/index.html', '/src'), 'content/index.html');
	assert.strictEqual(stripTopPath('src/content/index.html', '/src/'), 'content/index.html');
	assert.strictEqual(stripTopPath('src/content/index.html', '/src/'), 'content/index.html');
	assert.strictEqual(stripTopPath('src/index.html', 'src'), 'index.html');
	assert.strictEqual(stripTopPath('src/index.html', ''), 'src/index.html');
	assert.strictEqual(stripTopPath('src', 'src'), '');
	assert.strictEqual(stripTopPath('src', '/src/'), '');
	assert.strictEqual(stripTopPath('src', ''), 'src');

	assert.strictEqual(stripTopPath('sauce/content', 'sauce'), 'content');
});

test('strips bottom path', () => {
	assert.strictEqual(stripBottomPath('src/content/index.html'), 'src/content');
	assert.strictEqual(stripBottomPath('src/content'), 'src');
	assert.strictEqual(stripBottomPath('src'), '');
	assert.strictEqual(stripBottomPath(''), '');
});

test('decodes entities', () => {
	assert.strictEqual(decodeEntity('&amp;'), '&');
	assert.strictEqual(decodeEntity('&copy;'), '©');
	assert.strictEqual(decodeEntity('&lsquo;'), '‘');
	assert.strictEqual(decodeEntity('&rsquo;'), '’');
	assert.strictEqual(decodeEntity('&ldquo;'), '“');
	assert.strictEqual(decodeEntity('&rdquo;'), '”');

	assert.strictEqual(decodeEntity('&'), '&');
	assert.strictEqual(decodeEntity('a'), 'a');
});
