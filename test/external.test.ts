import { test } from 'node:test';
import assert from 'node:assert';
import { getDecapPaths } from '../src/external.ts';

test('get paths', () => {
	// uploaded to "static/images/uploads", referenced at "/images/uploads/*"
	assert.deepStrictEqual(
		getDecapPaths({
			media_folder: 'static/images/uploads',
			public_folder: '/images/uploads',
		}),
		{
			static: 'static',
			uploads: 'static/images/uploads',
		}
	);

	// uploaded to "uploads", referenced at "/other/*"
	// not supported
	assert.strictEqual(
		getDecapPaths({
			media_folder: 'uploads',
			public_folder: '/other',
		}),
		undefined
	);

	// public_folder defaults to media_folder value if unset
	assert.deepStrictEqual(
		getDecapPaths({
			media_folder: 'images/uploads',
		}),
		{
			static: '',
			uploads: 'images/uploads',
		}
	);
});
