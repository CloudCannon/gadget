import test from 'ava';
import Hugo from '../../src/ssgs/hugo.js';

const readFileMock = (path) => {
	if (path.endsWith('.yml') || path.endsWith('.yaml')) {
		return Promise.resolve(`path: ${path}`);
	}
	if (path.endsWith('toml')) {
		return Promise.resolve(`path = "${path}"`);
	}
    if (path.endsWith('json')) {
        return Promise.resolve(`{"path": "${path}"}`);
    }
    return Promise.resolve(null);
}

function parseConfigFromMultipleCandidates(t, filePaths, expectedFile) {
    const hugo = new Hugo();
	return hugo.parseConfig(filePaths, readFileMock)
		.then((result) => t.deepEqual(result, { path: expectedFile}))
}

test('reads config', (t) => {
    return parseConfigFromMultipleCandidates(t, ['config.toml'], 'config.toml')
});

test('prefers yaml over json config', (t) => {
    return parseConfigFromMultipleCandidates(t, [
		'hugo.json',
		'hugo.yaml',
	], 'hugo.yaml');
});

test('prefers toml over yaml config', (t) => {
    return parseConfigFromMultipleCandidates(t, [
		'hugo.json',
        'hugo.toml',
		'hugo.yaml',
	], 'hugo.toml');
});

test('prefers new config over older config', (t) => {
    return parseConfigFromMultipleCandidates(t, [
        'config.toml',
        'config.yaml',
        'config.json',
		'hugo.toml',
	], 'hugo.toml');
});
