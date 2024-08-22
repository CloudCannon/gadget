import test from 'ava';
import Hugo from '../../src/ssgs/hugo.js';

const readFileMock = async (path) => {
	if (path.endsWith('.yml') || path.endsWith('.yaml')) {
		return `path: ${path}`;
	}

	if (path.endsWith('toml')) {
		return `path = "${path}"`;
	}

	if (path.endsWith('json')) {
		return `{"path": "${path}"}`;
	}

	return '';
};

async function parseConfigFromMultipleCandidates(t, filePaths, expectedFile) {
	const hugo = new Hugo();
	const config = await hugo.parseConfig(filePaths, readFileMock);
	t.deepEqual(config, { path: expectedFile });
}

test('reads config', async (t) => {
	await parseConfigFromMultipleCandidates(t, ['config.toml'], 'config.toml');
});

test('prefers yaml over json config', async (t) => {
	await parseConfigFromMultipleCandidates(t, ['hugo.json', 'hugo.yaml'], 'hugo.yaml');
});

test('prefers toml over yaml config', async (t) => {
	await parseConfigFromMultipleCandidates(t, ['hugo.json', 'hugo.toml', 'hugo.yaml'], 'hugo.toml');
});

test('prefers new config over older config', async (t) => {
	await parseConfigFromMultipleCandidates(
		t,
		['config.toml', 'config.yaml', 'config.json', 'hugo.toml'],
		'hugo.toml',
	);
});
