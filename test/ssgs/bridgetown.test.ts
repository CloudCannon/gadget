import assert from 'node:assert';
import { test } from 'node:test';
import Bridgetown from '../../src/ssgs/bridgetown.ts';

const readFileMock = async (path: string): Promise<string> =>
	path.endsWith('.yml') || path.endsWith('.yaml') ? `path: ${path}` : '';

test('reads config', async () => {
	const bridgetown = new Bridgetown();
	const filePaths = ['bridgetown.config.yml'];
	const config = await bridgetown.parseConfig(filePaths, readFileMock);
	assert.deepStrictEqual(config, { path: 'bridgetown.config.yml' });
});
