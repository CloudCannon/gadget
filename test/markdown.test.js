import test from 'ava';
import Eleventy from '../src/ssgs/eleventy.js';
import Hugo from '../src/ssgs/hugo.js';
import Jekyll from '../src/ssgs/jekyll.js';
import Ssg from '../src/ssgs/ssg.js';

test('Defaults to CommonMark', (t) => {
	t.deepEqual(new Ssg().generateMarkdown({}), {
		engine: 'commonmark',
		options: {},
	});
});

test('Respects Jekyll Kramdown options enabled', (t) => {
	const markdown = new Jekyll().generateMarkdown({
		kramdown: {
			input: 'GFM',
			hard_wrap: true,
			gfm_quirks: [],
			auto_ids: true,
			smart_quotes: 'lsquo,rsquo,ldquo,rdquo',
		},
	});
	t.is(markdown.engine, 'kramdown');
	t.is(markdown.options.quotes, '‘’“”');
	t.true(markdown.options.breaks);
	t.true(markdown.options.gfm);
	t.true(markdown.options.heading_ids);
	t.true(markdown.options.typographer);
	t.true(markdown.options.treat_indentation_as_code);
});

test('Respects Jekyll Kramdown options disabled', (t) => {
	const markdown = new Jekyll().generateMarkdown({
		kramdown: {
			input: 'not_gfm',
			hard_wrap: false,
			gfm_quirks: ['no_auto_typographic'],
			auto_ids: false,
		},
	});
	t.is(markdown.engine, 'kramdown');
	t.false(markdown.options.breaks);
	t.false(markdown.options.gfm);
	t.false(markdown.options.heading_ids);
	t.false(markdown.options.typographer);
	t.true(markdown.options.treat_indentation_as_code);
});

test('Respects Jekyll CommonMark options', (t) => {
	const markdown = new Jekyll().generateMarkdown({
		markdown: 'CommonMark',
		commonmark: {
			options: ['HARDBREAKS', 'GFM_QUIRKS'],
			extensions: ['strikethrough', 'table', 'autolink', 'superscript', 'header_ids'],
		},
	});
	t.is(markdown.engine, 'commonmark');
	t.true(markdown.options.breaks);
	t.true(markdown.options.gfm);
	t.true(markdown.options.strikethrough);
	t.true(markdown.options.superscript);
	t.true(markdown.options.linkify);
	t.true(markdown.options.heading_ids);
	t.true(markdown.options.table);
	t.true(markdown.options.treat_indentation_as_code);
});

test('Respects Hugo options', (t) => {
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
	t.is(markdown.engine, 'commonmark');
	t.is(markdown.options.quotes, '‘’“”');
	t.true(markdown.options.attributes);
	t.true(markdown.options.linkify);
	t.true(markdown.options.strikethrough);
	t.true(markdown.options.table);
	t.true(markdown.options.treat_indentation_as_code);
	t.true(markdown.options.typographer);
	t.true(markdown.options.breaks);
	t.true(markdown.options.gfm);
	t.true(markdown.options.subscript);
	t.true(markdown.options.superscript);
	t.true(markdown.options.heading_ids);
	t.true(markdown.options.xhtml);
});

test('Respects Hugo options with attributes disabled', (t) => {
	const noAttrConfig = new Hugo().generateMarkdown({
		markup: {
			goldmark: {
				parser: {
					attribute: { block: false, title: false },
				},
			},
		},
	});
	t.false(noAttrConfig.options.attributes);
	t.is(noAttrConfig.options.attribute_elements, undefined);
});

test('Respects Hugo options with heading attributes enabled', (t) => {
	const noAttrConfig = new Hugo().generateMarkdown({
		markup: {
			goldmark: {
				parser: {
					attribute: { block: false, title: true },
				},
			},
		},
	});
	t.true(noAttrConfig.options.attributes);
	t.is(noAttrConfig.options.attribute_elements.h1, 'space right');
	t.is(noAttrConfig.options.attribute_elements.h6, 'space right');
	t.is(noAttrConfig.options.attribute_elements.blockquote, 'none');
	t.is(noAttrConfig.options.attribute_elements.table, 'none');
});

test('Respects Hugo options with block attributes enabled', (t) => {
	const noAttrConfig = new Hugo().generateMarkdown({
		markup: {
			goldmark: {
				parser: {
					attribute: { block: true, title: false },
				},
			},
		},
	});
	t.true(noAttrConfig.options.attributes);
	t.is(noAttrConfig.options.attribute_elements.h1, 'none');
	t.is(noAttrConfig.options.attribute_elements.img, 'none');
	t.is(noAttrConfig.options.attribute_elements.blockquote, 'below');
	t.is(noAttrConfig.options.attribute_elements.ul, 'below');
	t.is(noAttrConfig.options.attribute_elements.ol, 'below');
	t.is(noAttrConfig.options.attribute_elements.table, 'below');
	t.is(noAttrConfig.options.attribute_elements.p, 'below');
});

test('Respects Hugo options to enable attributes on standalone image', (t) => {
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
	t.true(noAttrConfig.options.attributes);
	t.is(noAttrConfig.options.attribute_elements.img, 'below');
});

test('Has good 11ty defaults', (t) => {
	t.deepEqual(new Eleventy().generateMarkdown(undefined), {
		engine: 'commonmark',
		options: {
			html: true,
		},
	});
});
