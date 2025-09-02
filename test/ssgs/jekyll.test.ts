import { expect, it } from 'vitest';
import Jekyll from '../../src/ssgs/jekyll';

it('gets source path from convention path', () => {
	const jekyll = new Jekyll();
	const filePaths = [
		'_config.yml',
		'sauce/_drafts/wip.md',
		'sauce/index.html',
		'sauce/_includes/header.html',
		'sauce/_sass/_typography.scss',
	];
	expect(jekyll.getSource(filePaths)).toBe('sauce');
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

it('reads config', async () => {
	const jekyll = new Jekyll();
	const filePaths = ['_config.toml'];
	const config = await jekyll.parseConfig(filePaths, readFileMock);
	expect(config).toStrictEqual({ path: '_config.toml' });
});

it('prefers yaml over toml config', async () => {
	const jekyll = new Jekyll();
	const filePaths = ['_config.toml', '_config.yaml'];
	const config = await jekyll.parseConfig(filePaths, readFileMock);
	expect(config).toStrictEqual({ path: '_config.yaml' });
});

it('prefers yml over yaml config', async () => {
	const jekyll = new Jekyll();
	const filePaths = ['_config.toml', '_config.yml', '_config.yaml'];
	const config = await jekyll.parseConfig(filePaths, readFileMock);
	expect(config).toStrictEqual({ path: '_config.yml' });
});
