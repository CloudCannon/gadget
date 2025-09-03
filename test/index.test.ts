import { expect, it } from 'vitest';
import { generateConfiguration } from '../src/index';

const readFile = async (path: string): Promise<string> =>
	path.endsWith('.yml') || path.endsWith('.yaml') ? `path: ${path}` : '';

it('generates configuration', async () => {
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

	expect(configuration).toMatchObject({
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
				collections: [
					{
						key: 'data',
						config: {
							icon: 'data_usage',
							path: '_data',
						},
						collections: [
							{
								key: 'data_authors',
								config: {
									icon: 'data_alert',
									path: '_data/authors',
								},
								collections: [],
							},
							{
								key: 'data_locations',
								config: {
									icon: 'add_location',
									path: '_data/locations',
								},
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
					},
					{
						key: 'content',
						config: {
							icon: 'wysiwyg',
							path: 'content',
						},
						collections: [
							{
								key: 'about',
								config: {
									icon: 'bolt',
									path: 'content/about',
								},
								collections: [],
							},
							{
								key: 'posts',
								config: {
									icon: 'event_available',
									path: 'content/posts',
								},
								collections: [],
							},
						],
					},
				],
			},
		],
	});
});
