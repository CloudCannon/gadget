import test from 'ava';
import { ssgs } from '../src/ssgs/ssgs.js';
import Ssg from '../src/ssgs/ssg.js';

function generateMarkdown(ssgKey, config) {
	const ssg = ssgs[ssgKey] ?? new Ssg();
	return ssg.generateMarkdown(config);
}

test('Defaults to CommonMark', (t) => {
	t.deepEqual(generateMarkdown('', {}), {
		engine: 'commonmark',
		options: {},
	});
});

test('Respects Jekyll Kramdown options enabled', (t) => {
	t.deepEqual(
		generateMarkdown('jekyll', {
			kramdown: {
				input: 'GFM',
				hard_wrap: true,
				gfm_quirks: [],
				auto_ids: true,
				smart_quotes: 'lsquo,rsquo,ldquo,rdquo',
			},
		}),
		{
			engine: 'kramdown',
			options: {
				breaks: true,
				gfm: true,
				heading_ids: true,
				quotes: '‘’“”',
				treat_indentation_as_code: true,
				typographer: true,
			},
		},
	);
});

test('Respects Jekyll Kramdown options disabled', (t) => {
	t.deepEqual(
		generateMarkdown('jekyll', {
			kramdown: {
				input: 'not_gfm',
				hard_wrap: false,
				gfm_quirks: ['no_auto_typographic'],
				auto_ids: false,
			},
		}),
		{
			engine: 'kramdown',
			options: {
				breaks: false,
				gfm: false,
				heading_ids: false,
				treat_indentation_as_code: true,
				typographer: false,
			},
		},
	);
});

test('Respects Jekyll CommonMark options', (t) => {
	t.deepEqual(
		generateMarkdown('jekyll', {
			markdown: 'CommonMark',
			commonmark: {
				options: ['HARDBREAKS', 'GFM_QUIRKS'],
				extensions: ['strikethrough', 'table', 'autolink', 'superscript', 'header_ids'],
			},
		}),
		{
			engine: 'commonmark',
			options: {
				breaks: true,
				gfm: true,
				strikethrough: true,
				superscript: true,
				linkify: true,
				heading_ids: true,
				table: true,
				treat_indentation_as_code: true,
			},
		},
	);
});

test('Respects Hugo options', (t) => {
	t.deepEqual(
		generateMarkdown('hugo', {
			markup: {
				goldmark: {
					extensions: {
						linkify: true,
						strikethrough: true,
						table: true,
						extras: {
							delete: { enable: true },
							subscript: { enable: true },
							superscript: { enable: true },
						},
						typographer: {
							disable: false,
							leftDoubleQuote: '&ldquo;',
							leftSingleQuote: '&lsquo;',
							rightDoubleQuote: '&rdquo;',
							rightSingleQuote: '&rsquo;',
						},
					},
					parser: {
						autoHeadingID: true,
						attribute: { block: false, title: true },
					},
					renderer: { hardWraps: true, xhtml: true },
				},
			},
		}),
		{
			engine: 'commonmark',
			options: {
				attributes: true,
				linkify: true,
				strikethrough: true,
				table: true,
				treat_indentation_as_code: true,
				typographer: true,
				quotes: '‘’“”',
				breaks: true,
				gfm: true,
				subscript: true,
				superscript: true,
				heading_ids: true,
				breaks: true,
				xhtml: true,
			},
		},
	);
});

test('Has good 11ty defaults', (t) => {
	t.deepEqual(generateMarkdown('eleventy', undefined), {
		engine: 'commonmark',
		options: {
			html: true,
		},
	});
});
