import test from 'ava';
import { last } from '../src/utility.js';

test('gets last element', (t) => {
	t.is(last(['first', 'final']), 'final');
	t.is(last(['first']), 'first');
	t.is(last([]), undefined);
});
