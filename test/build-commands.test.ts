import { expect, it } from 'vitest';
import Ssg from '../src/ssgs/ssg';

const readFileMock = async (path: string): Promise<string> => {
	if (path.endsWith('package.json')) {
		return `{ "scripts": { "build": "webpack" } }`;
	}
	if (path.endsWith('.forestry/settings.yml')) {
		return 'build:\n  install_dependencies_command: npm i';
	}
	if (path.endsWith('netlify.toml')) {
		return `[build]\npublish = "out"\ncommand = "webpack"`;
	}
	if (path.endsWith('vercel.json')) {
		return `{
            "buildCommand": "webpack",
            "installCommand": "npm i",
            "outputDirectory": "out"
        }`;
	}

	return '';
};

it('Look at package.json', async () => {
	const ssg = new Ssg();
	const filePaths = ['package.json'];
	const buildCommands = await ssg.generateBuildCommands(filePaths, { readFile: readFileMock });
	expect(buildCommands?.install?.[0]?.value).toBe('npm i');
	expect(buildCommands?.build?.[0]?.value).toBe('npm run build');
	expect(buildCommands?.preserved?.[0]?.value).toBe('node_modules/');
});

it('Look at yarn.lock', async () => {
	const ssg = new Ssg();
	const filePaths = ['package.json', 'yarn.lock'];
	const buildCommands = await ssg.generateBuildCommands(filePaths, { readFile: readFileMock });
	expect(buildCommands?.install?.[0]?.value).toBe('yarn');
});

it("Don't prefer yarn over npm", async () => {
	const ssg = new Ssg();
	const filePaths = ['package.json', 'package-lock.json', 'yarn.lock'];
	const buildCommands = await ssg.generateBuildCommands(filePaths, { readFile: readFileMock });
	expect(buildCommands?.install?.[0]?.value).toBe('npm i');
});

it('Read forestry settings', async () => {
	const ssg = new Ssg();
	const filePaths = ['.forestry/settings.yml'];
	const buildCommands = await ssg.generateBuildCommands(filePaths, { readFile: readFileMock });
	expect(buildCommands?.install?.[0]?.value).toBe('npm i');
});

it('Read netlify settings', async () => {
	const ssg = new Ssg();
	const filePaths = ['netlify.toml'];
	const buildCommands = await ssg.generateBuildCommands(filePaths, { readFile: readFileMock });
	expect(buildCommands?.build?.[0]?.value).toBe('webpack');
	expect(buildCommands?.output?.[0]?.value).toBe('out');
});

it('Read vercel settings', async () => {
	const ssg = new Ssg();
	const filePaths = ['vercel.json'];
	const buildCommands = await ssg.generateBuildCommands(filePaths, { readFile: readFileMock });
	expect(buildCommands?.install?.[0]?.value).toBe('npm i');
	expect(buildCommands?.build?.[0]?.value).toBe('webpack');
	expect(buildCommands?.output?.[0]?.value).toBe('out');
});

it('Avoid misconfigurations in settings files', async () => {
	const ssg = new Ssg();
	const readWeirdFile = async (): Promise<string> => `{
        "buildCommand": ["webpack"],
        "installCommand": true,
        "outputDirectory": 5
    }`;
	const buildCommands = await ssg.generateBuildCommands(['vercel.json'], {
		readFile: readWeirdFile,
	});
	expect(buildCommands?.install?.length).toBeFalsy();
	expect(buildCommands?.build?.length).toBeFalsy();
	expect(buildCommands?.output?.length).toBeFalsy();
});
