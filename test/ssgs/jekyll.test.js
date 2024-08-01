import test from 'ava';
import Jekyll from '../../src/ssgs/jekyll.js';

test('gets source path from convention path', (t) => {
	const jekyll = new Jekyll();
	const filePaths = [
		'_config.yml',
		'sauce/_drafts/wip.md',
		'sauce/index.html',
		'sauce/_includes/header.html',
		'sauce/_sass/_typography.scss',
	];

	t.deepEqual(jekyll.getSource(filePaths), 'sauce');
});
