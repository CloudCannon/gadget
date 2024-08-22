import test from 'ava';
import Bridgetown from '../../src/ssgs/bridgetown.js';

const readFileMock = async (path) => {
	if (path.endsWith('.yml') || path.endsWith('.yaml')) {
		return `path: ${path}`;
	}

	return '';
}

test('bridge', async (t) => {
	const bridgetown = new Bridgetown();
	const filePaths = [
		'bridgetown.config.yml',
	];

	const config = await bridgetown.parseConfig(filePaths, readFileMock);
	t.deepEqual(config, { path: 'bridgetown.config.yml' });
});
