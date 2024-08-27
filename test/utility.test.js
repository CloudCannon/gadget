import test from 'ava';
import { last, joinPaths, stripTopPath, decodeEntity } from '../src/utility.js';

test('gets last element', (t) => {
	t.is(last(['first', 'final']), 'final');
	t.is(last(['first']), 'first');
	t.is(last([]), undefined);
});

test('joins paths', (t) => {
	t.is(joinPaths(['first']), 'first');
	t.is(joinPaths(['first', 'final']), 'first/final');
	t.is(joinPaths(['/first/', '//fi///nal']), 'first/fi/nal');
	t.is(joinPaths([]), '');
});

test('strips top path', (t) => {
	t.is(stripTopPath('src/content/index.html', 'src'), 'content/index.html');
	t.is(stripTopPath('src/index.html', 'src'), 'index.html');
	t.is(stripTopPath('src/index.html', ''), 'src/index.html');
	t.is(stripTopPath('src', 'src'), '');
	t.is(stripTopPath('src', ''), 'src');
});

test('decodes entities', (t) => {
	t.is(decodeEntity('&amp;'), '&');
	t.is(decodeEntity('&copy;'), '©');
	t.is(decodeEntity('&lsquo;'), '‘');
	t.is(decodeEntity('&rsquo;'), '’');
	t.is(decodeEntity('&ldquo;'), '“');
	t.is(decodeEntity('&rdquo;'), '”');

	t.is(decodeEntity('&'), '&');
	t.is(decodeEntity('a'), 'a');
});
