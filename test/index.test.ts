import assert from 'node:assert';
import { test } from 'node:test';
import { generateConfiguration } from '../src/index.ts';

const readFile = async (path: string): Promise<string> =>
	path.endsWith('.yml') || path.endsWith('.yaml') ? `path: ${path}` : '';

test('generates configuration', async () => {
	const filePaths = [
		'index.html',
		'about.html',
		'blog.html',
		'contact/index.html',
		'content/index.md',
		'content/contact.md',
		'content/blog.md',
		'content/about/index.md',
		'content/about/hero.png',
		'content/posts/first-post.md',
		'content/posts/second-post.md',
		'_data/authors/jim.json',
		'_data/authors/pam.json',
		'_data/locations/the-moon.json',
		'_data/locations/antarctica.json',
		'_data/locations/new-zealand.json',
	];

	const configuration = await generateConfiguration(filePaths, { readFile });

	assert.ok(configuration.config.timezone);
	delete configuration.config.timezone;

	assert.deepStrictEqual(configuration, {
		config: {
			markdown: {
				engine: 'commonmark',
				options: {},
			},
			paths: {
				static: '',
				uploads: 'uploads',
			},
		},
		ssg: 'other',
		collections: [
			{
				key: 'pages',
				config: {
					path: '',
					icon: 'wysiwyg',
				},
				suggested: true,
				collections: [
					{
						key: 'data',
						config: {
							icon: 'data_usage',
							path: '_data',
						},
						suggested: false,
						collections: [
							{
								key: 'data_authors',
								config: {
									icon: 'data_alert',
									path: '_data/authors',
								},
								suggested: true,
								collections: [],
							},
							{
								key: 'data_locations',
								config: {
									icon: 'add_location',
									path: '_data/locations',
								},
								suggested: true,
								collections: [],
							},
						],
					},
					{
						collections: [],
						config: {
							icon: 'contacts',
							path: 'contact',
						},
						key: 'contact',
						suggested: true,
					},
					{
						key: 'content',
						config: {
							icon: 'wysiwyg',
							path: 'content',
						},
						suggested: true,
						collections: [
							{
								key: 'about',
								config: {
									icon: 'bolt',
									path: 'content/about',
								},
								suggested: false,
								collections: [],
							},
							{
								key: 'posts',
								config: {
									icon: 'event_available',
									path: 'content/posts',
								},
								suggested: false,
								collections: [],
							},
						],
					},
				],
			},
		],
	});
});
