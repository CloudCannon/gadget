import { test } from 'node:test';
import assert from 'node:assert';
import Jekyll from '../../src/ssgs/jekyll.ts';

test('gets source path from convention path', () => {
	const jekyll = new Jekyll();
	const filePaths = [
		'_config.yml',
		'sauce/_drafts/wip.md',
		'sauce/index.html',
		'sauce/_includes/header.html',
		'sauce/_sass/_typography.scss',
	];
	assert.strictEqual(jekyll.getSource(filePaths), 'sauce');
});

const readFileMock = async (path: string): Promise<string> => {
	if (path.endsWith('.yml') || path.endsWith('.yaml')) {
		return `path: ${path}`;
	}

	if (path.endsWith('toml')) {
		return `path = "${path}"`;
	}

	return '';
};

test('reads config', async () => {
	const jekyll = new Jekyll();
	const filePaths = ['_config.toml'];
	const config = await jekyll.parseConfig(filePaths, readFileMock);
	assert.deepStrictEqual(config, { path: '_config.toml' });
});

test('prefers yaml over toml config', async () => {
	const jekyll = new Jekyll();
	const filePaths = ['_config.toml', '_config.yaml'];
	const config = await jekyll.parseConfig(filePaths, readFileMock);
	assert.deepStrictEqual(config, { path: '_config.yaml' });
});

test('prefers yml over yaml config', async () => {
	const jekyll = new Jekyll();
	const filePaths = ['_config.toml', '_config.yml', '_config.yaml'];
	const config = await jekyll.parseConfig(filePaths, readFileMock);
	assert.deepStrictEqual(config, { path: '_config.yml' });
});
