import assert from 'node:assert';
import { test } from 'node:test';
import Eleventy from '../src/ssgs/eleventy.ts';
import Hugo from '../src/ssgs/hugo.ts';
import Jekyll from '../src/ssgs/jekyll.ts';
import Ssg from '../src/ssgs/ssg.ts';

test('Defaults to CommonMark', () => {
	assert.deepStrictEqual(new Ssg().generateMarkdown({}), {
		engine: 'commonmark',
		options: {},
	});
});

test('Respects Jekyll Kramdown options enabled', () => {
	const markdown = new Jekyll().generateMarkdown({
		kramdown: {
			input: 'GFM',
			hard_wrap: true,
			gfm_quirks: [],
			auto_ids: true,
			smart_quotes: 'lsquo,rsquo,ldquo,rdquo',
		},
	});
	assert.strictEqual(markdown.engine, 'kramdown');
	assert.strictEqual(markdown.options.quotes, '‘’“”');
	assert.strictEqual(markdown.options.breaks, true);
	assert.strictEqual(markdown.options.gfm, true);
	assert.strictEqual(markdown.options.heading_ids, true);
	assert.strictEqual(markdown.options.typographer, true);
	assert.strictEqual(markdown.options.treat_indentation_as_code, true);
});

test('Respects Jekyll Kramdown options disabled', () => {
	const markdown = new Jekyll().generateMarkdown({
		kramdown: {
			input: 'not_gfm',
			hard_wrap: false,
			gfm_quirks: ['no_auto_typographic'],
			auto_ids: false,
		},
	});
	assert.strictEqual(markdown.engine, 'kramdown');
	assert.strictEqual(markdown.options.breaks, false);
	assert.strictEqual(markdown.options.gfm, false);
	assert.strictEqual(markdown.options.heading_ids, false);
	assert.strictEqual(markdown.options.typographer, false);
	assert.strictEqual(markdown.options.treat_indentation_as_code, true);
});

test('Respects Jekyll CommonMark options', () => {
	const markdown = new Jekyll().generateMarkdown({
		markdown: 'CommonMark',
		commonmark: {
			options: ['HARDBREAKS', 'GFM_QUIRKS'],
			extensions: ['strikethrough', 'table', 'autolink', 'superscript', 'header_ids'],
		},
	});
	assert.strictEqual(markdown.engine, 'commonmark');
	assert.strictEqual(markdown.options.breaks, true);
	assert.strictEqual(markdown.options.gfm, true);
	assert.strictEqual(markdown.options.strikethrough, true);
	assert.strictEqual(markdown.options.superscript, true);
	assert.strictEqual(markdown.options.linkify, true);
	assert.strictEqual(markdown.options.heading_ids, true);
	assert.strictEqual(markdown.options.table, true);
	assert.strictEqual(markdown.options.treat_indentation_as_code, true);
});

test('Respects Hugo options', () => {
	const markdown = new Hugo().generateMarkdown({
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
	});
	assert.strictEqual(markdown.engine, 'commonmark');
	assert.strictEqual(markdown.options.quotes, '‘’“”');
	assert.strictEqual(markdown.options.attributes, true);
	assert.strictEqual(markdown.options.linkify, true);
	assert.strictEqual(markdown.options.strikethrough, true);
	assert.strictEqual(markdown.options.table, true);
	assert.strictEqual(markdown.options.treat_indentation_as_code, true);
	assert.strictEqual(markdown.options.typographer, true);
	assert.strictEqual(markdown.options.breaks, true);
	assert.strictEqual(markdown.options.gfm, true);
	assert.strictEqual(markdown.options.subscript, true);
	assert.strictEqual(markdown.options.superscript, true);
	assert.strictEqual(markdown.options.heading_ids, true);
	assert.strictEqual(markdown.options.xhtml, true);
});

test('Respects Hugo options with attributes disabled', () => {
	const noAttrConfig = new Hugo().generateMarkdown({
		markup: {
			goldmark: {
				parser: {
					attribute: { block: false, title: false },
				},
			},
		},
	});
	assert.strictEqual(noAttrConfig.options.attributes, false);
	assert.strictEqual(noAttrConfig.options.attribute_elements, undefined);
});

test('Respects Hugo options with heading attributes enabled', () => {
	const noAttrConfig = new Hugo().generateMarkdown({
		markup: {
			goldmark: {
				parser: {
					attribute: { block: false, title: true },
				},
			},
		},
	});
	assert.strictEqual(noAttrConfig.options.attributes, true);
	assert.strictEqual(noAttrConfig.options.attribute_elements?.h1, 'space right');
	assert.strictEqual(noAttrConfig.options.attribute_elements?.h6, 'space right');
	assert.strictEqual(noAttrConfig.options.attribute_elements?.blockquote, 'none');
	assert.strictEqual(noAttrConfig.options.attribute_elements?.table, 'none');
});

test('Respects Hugo options with block attributes enabled', () => {
	const noAttrConfig = new Hugo().generateMarkdown({
		markup: {
			goldmark: {
				parser: {
					attribute: { block: true, title: false },
				},
			},
		},
	});
	assert.strictEqual(noAttrConfig.options.attributes, true);
	assert.strictEqual(noAttrConfig.options.attribute_elements?.h1, 'none');
	assert.strictEqual(noAttrConfig.options.attribute_elements?.img, 'none');
	assert.strictEqual(noAttrConfig.options.attribute_elements?.blockquote, 'below');
	assert.strictEqual(noAttrConfig.options.attribute_elements?.ul, 'below');
	assert.strictEqual(noAttrConfig.options.attribute_elements?.ol, 'below');
	assert.strictEqual(noAttrConfig.options.attribute_elements?.table, 'below');
	assert.strictEqual(noAttrConfig.options.attribute_elements?.p, 'below');
});

test('Respects Hugo options to enable attributes on standalone image', () => {
	const noAttrConfig = new Hugo().generateMarkdown({
		markup: {
			goldmark: {
				parser: {
					attribute: { block: true },
					wrapStandAloneImageWithinParagraph: false,
				},
			},
		},
	});
	assert.strictEqual(noAttrConfig.options.attributes, true);
	assert.strictEqual(noAttrConfig.options.attribute_elements?.img, 'below');
});

test('Has good 11ty defaults', () => {
	assert.deepStrictEqual(new Eleventy().generateMarkdown(undefined), {
		engine: 'commonmark',
		options: {
			html: true,
		},
	});
});
