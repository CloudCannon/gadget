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

const readFileMock = async (path) => {
	if (path.endsWith('.yml') || path.endsWith('.yaml')) {
		return `path: ${path}`;
	}

	if (path.endsWith('toml')) {
		return `path = "${path}"`;
	}

	return '';
}

test('reads config', async (t) => {
	const jekyll = new Jekyll();
	const filePaths = [
		'_config.toml',
	];
	const config = await jekyll.parseConfig(filePaths, readFileMock);
	t.deepEqual(config, { path: '_config.toml' });
});

test('prefers yaml over toml config', async (t) => {
	const jekyll = new Jekyll();
	const filePaths = [
		'_config.toml',
		'_config.yaml',
	];

	const config = await jekyll.parseConfig(filePaths, readFileMock);
	t.deepEqual(config, { path: '_config.yaml' });
});

test('prefers yml over yaml config', async (t) => {
	const jekyll = new Jekyll();
	const filePaths = [
		'_config.toml',
		'_config.yml',
		'_config.yaml',
	];

	const config = await jekyll.parseConfig(filePaths, readFileMock);
	t.deepEqual(config, { path: '_config.yml' });
});
