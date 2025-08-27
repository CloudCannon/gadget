import { expect, it } from 'vitest';
import Hugo from '../../src/ssgs/hugo';

const readFileMock = async (path: string): Promise<string> => {
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

async function parseConfigFromMultipleCandidates(
	filePaths: string[],
	expectedFile: string
): Promise<void> {
	const hugo = new Hugo();
	const config = await hugo.parseConfig(filePaths, readFileMock);
	expect(config).toEqual({ path: expectedFile });
}

it('reads config', async () => {
	await parseConfigFromMultipleCandidates(['config.toml'], 'config.toml');
});

it('prefers yaml over json config', async () => {
	await parseConfigFromMultipleCandidates(['hugo.json', 'hugo.yaml'], 'hugo.yaml');
});

it('prefers toml over yaml config', async () => {
	await parseConfigFromMultipleCandidates(['hugo.json', 'hugo.toml', 'hugo.yaml'], 'hugo.toml');
});

it('prefers new config over older config', async () => {
	await parseConfigFromMultipleCandidates(
		['config.toml', 'config.yaml', 'config.json', 'hugo.toml'],
		'hugo.toml'
	);
});
