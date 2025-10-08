import { expect, it } from 'vitest';
import { getDecapPaths } from '../src/external';

it('get paths', () => {
	// uploaded to "static/images/uploads", referenced at "/images/uploads/*"
	expect(
		getDecapPaths({
			media_folder: 'static/images/uploads',
			public_folder: '/images/uploads',
		})
	).toStrictEqual({
		static: 'static',
		uploads: 'static/images/uploads',
	});

	// uploaded to "uploads", referenced at "/other/*"
	// not supported
	expect(
		getDecapPaths({
			media_folder: 'uploads',
			public_folder: '/other',
		})
	).toBeUndefined();

	// public_folder defaults to media_folder value if unset
	expect(
		getDecapPaths({
			media_folder: 'images/uploads',
		})
	).toStrictEqual({
		static: '',
		uploads: 'images/uploads',
	});
});
