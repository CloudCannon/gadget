import test from 'ava';
import Bridgetown from '../../src/ssgs/bridgetown.js';

const readFileMock = (path) => {
	if (path.endsWith('.yml') || path.endsWith('.yaml')) {
		return Promise.resolve(`path: ${path}`);
	}
    return Promise.resolve(null);
}

test('bridge', (t) => {
	const bridgetown = new Bridgetown();
	const filePaths = [
		'bridgetown.config.yml',
	];
	return bridgetown.parseConfig(filePaths, readFileMock)
		.then((result) => t.deepEqual(result, { path: 'bridgetown.config.yml'}))
});