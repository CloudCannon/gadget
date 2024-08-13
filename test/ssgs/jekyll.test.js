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

const readFileMock = (path) => {
	if (path.endsWith('.yml') || path.endsWith('.yaml')) {
		return Promise.resolve(`path: ${path}`);
	}
	if (path.endsWith('toml')) {
		return Promise.resolve(`path = "${path}"`);
	}
}

test('reads config', (t) => {
	const jekyll = new Jekyll();
	const filePaths = [
		'_config.toml',
	];
	return jekyll.parseConfig(filePaths, readFileMock)
		.then((result) => t.deepEqual(result, { path: '_config.toml'}))
});

test('prefers yaml over toml config', (t) => {
	const jekyll = new Jekyll();
	const filePaths = [
		'_config.toml',
		'_config.yaml',
	];
	return jekyll.parseConfig(filePaths, readFileMock)
		.then((result) => t.deepEqual(result, { path: '_config.yaml'}))
});

test('prefers yml over yaml config', (t) => {
	const jekyll = new Jekyll();
	const filePaths = [
		'_config.toml',
		'_config.yml',
		'_config.yaml',
	];
	return jekyll.parseConfig(filePaths, readFileMock)
		.then((result) => t.deepEqual(result, { path: '_config.yml'}))
});
