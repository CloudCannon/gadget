import type { MarkdownAttributeElementOptions } from '@cloudcannon/configuration-types';

export const commonmarkAttributeElementOptions: MarkdownAttributeElementOptions = {
	inline: 'none',
	block: 'space right',
	img: 'right',
	ul: 'below',
	ol: 'below',
	li: 'space right',
	table: 'newline below',
	blockquote: 'below',
};

export const kramdownAttributeElementOptions: MarkdownAttributeElementOptions = {
	inline: 'right',
	block: 'below',
	tr: 'none',
	td: 'none',
	li: 'right-of-prefix',
};
