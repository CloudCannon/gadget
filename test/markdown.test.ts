import { expect, it } from 'vitest';
import Eleventy from '../src/ssgs/eleventy';
import Hugo from '../src/ssgs/hugo';
import Jekyll from '../src/ssgs/jekyll';
import Ssg from '../src/ssgs/ssg';

it('Defaults to CommonMark', () => {
	expect(new Ssg().generateMarkdown({})).toEqual({
		engine: 'commonmark',
		options: {},
	});
});

it('Respects Jekyll Kramdown options enabled', () => {
	const markdown = new Jekyll().generateMarkdown({
		kramdown: {
			input: 'GFM',
			hard_wrap: true,
			gfm_quirks: [],
			auto_ids: true,
			smart_quotes: 'lsquo,rsquo,ldquo,rdquo',
		},
	});
	expect(markdown.engine).toBe('kramdown');
	expect(markdown.options.quotes).toBe('‘’“”');
	expect(markdown.options.breaks).toBe(true);
	expect(markdown.options.gfm).toBe(true);
	expect(markdown.options.heading_ids).toBe(true);
	expect(markdown.options.typographer).toBe(true);
	expect(markdown.options.treat_indentation_as_code).toBe(true);
});

it('Respects Jekyll Kramdown options disabled', () => {
	const markdown = new Jekyll().generateMarkdown({
		kramdown: {
			input: 'not_gfm',
			hard_wrap: false,
			gfm_quirks: ['no_auto_typographic'],
			auto_ids: false,
		},
	});
	expect(markdown.engine).toBe('kramdown');
	expect(markdown.options.breaks).toBe(false);
	expect(markdown.options.gfm).toBe(false);
	expect(markdown.options.heading_ids).toBe(false);
	expect(markdown.options.typographer).toBe(false);
	expect(markdown.options.treat_indentation_as_code).toBe(true);
});

it('Respects Jekyll CommonMark options', () => {
	const markdown = new Jekyll().generateMarkdown({
		markdown: 'CommonMark',
		commonmark: {
			options: ['HARDBREAKS', 'GFM_QUIRKS'],
			extensions: ['strikethrough', 'table', 'autolink', 'superscript', 'header_ids'],
		},
	});
	expect(markdown.engine).toBe('commonmark');
	expect(markdown.options.breaks).toBe(true);
	expect(markdown.options.gfm).toBe(true);
	expect(markdown.options.strikethrough).toBe(true);
	expect(markdown.options.superscript).toBe(true);
	expect(markdown.options.linkify).toBe(true);
	expect(markdown.options.heading_ids).toBe(true);
	expect(markdown.options.table).toBe(true);
	expect(markdown.options.treat_indentation_as_code).toBe(true);
});

it('Respects Hugo options', () => {
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
	expect(markdown.engine).toBe('commonmark');
	expect(markdown.options.quotes).toBe('‘’“”');
	expect(markdown.options.attributes).toBe(true);
	expect(markdown.options.linkify).toBe(true);
	expect(markdown.options.strikethrough).toBe(true);
	expect(markdown.options.table).toBe(true);
	expect(markdown.options.treat_indentation_as_code).toBe(true);
	expect(markdown.options.typographer).toBe(true);
	expect(markdown.options.breaks).toBe(true);
	expect(markdown.options.gfm).toBe(true);
	expect(markdown.options.subscript).toBe(true);
	expect(markdown.options.superscript).toBe(true);
	expect(markdown.options.heading_ids).toBe(true);
	expect(markdown.options.xhtml).toBe(true);
});

it('Respects Hugo options with attributes disabled', () => {
	const noAttrConfig = new Hugo().generateMarkdown({
		markup: {
			goldmark: {
				parser: {
					attribute: { block: false, title: false },
				},
			},
		},
	});
	expect(noAttrConfig.options.attributes).toBe(false);
	expect(noAttrConfig.options.attribute_elements).toBe(undefined);
});

it('Respects Hugo options with heading attributes enabled', () => {
	const noAttrConfig = new Hugo().generateMarkdown({
		markup: {
			goldmark: {
				parser: {
					attribute: { block: false, title: true },
				},
			},
		},
	});
	expect(noAttrConfig.options.attributes).toBe(true);
	expect(noAttrConfig.options.attribute_elements?.h1).toBe('space right');
	expect(noAttrConfig.options.attribute_elements?.h6).toBe('space right');
	expect(noAttrConfig.options.attribute_elements?.blockquote).toBe('none');
	expect(noAttrConfig.options.attribute_elements?.table).toBe('none');
});

it('Respects Hugo options with block attributes enabled', () => {
	const noAttrConfig = new Hugo().generateMarkdown({
		markup: {
			goldmark: {
				parser: {
					attribute: { block: true, title: false },
				},
			},
		},
	});
	expect(noAttrConfig.options.attributes).toBe(true);
	expect(noAttrConfig.options.attribute_elements?.h1).toBe('none');
	expect(noAttrConfig.options.attribute_elements?.img).toBe('none');
	expect(noAttrConfig.options.attribute_elements?.blockquote).toBe('below');
	expect(noAttrConfig.options.attribute_elements?.ul).toBe('below');
	expect(noAttrConfig.options.attribute_elements?.ol).toBe('below');
	expect(noAttrConfig.options.attribute_elements?.table).toBe('below');
	expect(noAttrConfig.options.attribute_elements?.p).toBe('below');
});

it('Respects Hugo options to enable attributes on standalone image', () => {
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
	expect(noAttrConfig.options.attributes).toBe(true);
	expect(noAttrConfig.options.attribute_elements?.img).toBe('below');
});

it('Has good 11ty defaults', () => {
	expect(new Eleventy().generateMarkdown(undefined)).toEqual({
		engine: 'commonmark',
		options: {
			html: true,
		},
	});
});
