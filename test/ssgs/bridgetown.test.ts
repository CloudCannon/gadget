import { expect, it } from 'vitest';
import Bridgetown from '../../src/ssgs/bridgetown';

const readFileMock = async (path: string): Promise<string> =>
	path.endsWith('.yml') || path.endsWith('.yaml') ? `path: ${path}` : '';

it('reads config', async () => {
	const bridgetown = new Bridgetown();
	const filePaths = ['bridgetown.config.yml'];
	const config = await bridgetown.parseConfig(filePaths, readFileMock);
	expect(config).toStrictEqual({ path: 'bridgetown.config.yml' });
});
