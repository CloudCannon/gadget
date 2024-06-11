import test from 'ava';
import { last, stripTopPath } from '../src/utility.js';

test('gets last element', (t) => {
	t.is(last(['first', 'final']), 'final');
	t.is(last(['first']), 'first');
	t.is(last([]), undefined);
});

test('strips top path', (t) => {
	t.is(stripTopPath('src/content/index.html', 'src'), 'content/index.html');
	t.is(stripTopPath('src/content/index.html', ''), 'src/content/index.html');
	t.is(stripTopPath('src', 'src'), '');
});
