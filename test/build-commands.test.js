import test from 'ava';
import Ssg from '../src/ssgs/ssg.js';

const readFileMock = async (path) => {
	if (path.endsWith('package.json')) {
		return `{ "scripts": { "build": "webpack" } }`;
	}
	if (path.endsWith('.forestry/settings.yml')) {
		return `build:\n  install_dependencies_command: npm i`;
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

test('Look at package.json', async (t) => {
	const ssg = new Ssg();
	const filePaths = ['package.json'];
	const buildCommands = await ssg.generateBuildCommands(filePaths, { readFile: readFileMock });
	t.is(buildCommands?.install?.[0]?.value, 'npm i');
	t.is(buildCommands?.build?.[0]?.value, 'npm run build');
	t.is(buildCommands?.preserved?.[0]?.value, 'node_modules/');
});

test('Look at yarn.lock', async (t) => {
	const ssg = new Ssg();
	const filePaths = ['package.json', 'yarn.lock'];
	const buildCommands = await ssg.generateBuildCommands(filePaths, { readFile: readFileMock });
	t.is(buildCommands?.install?.[0]?.value, 'yarn');
});

test("Don't prefer yarn over npm", async (t) => {
	const ssg = new Ssg();
	const filePaths = ['package.json', 'package-lock.json', 'yarn.lock'];
	const buildCommands = await ssg.generateBuildCommands(filePaths, { readFile: readFileMock });
	t.is(buildCommands?.install?.[0]?.value, 'npm i');
});

test('Read forestry settings', async (t) => {
	const ssg = new Ssg();
	const filePaths = ['.forestry/settings.yml'];
	const buildCommands = await ssg.generateBuildCommands(filePaths, { readFile: readFileMock });
	t.is(buildCommands?.install?.[0]?.value, 'npm i');
});

test('Read netlify settings', async (t) => {
	const ssg = new Ssg();
	const filePaths = ['netlify.toml'];
	const buildCommands = await ssg.generateBuildCommands(filePaths, { readFile: readFileMock });
	t.is(buildCommands?.build?.[0]?.value, 'webpack');
	t.is(buildCommands?.output?.[0]?.value, 'out');
});

test('Read vercel settings', async (t) => {
	const ssg = new Ssg();
	const filePaths = ['vercel.json'];
	const buildCommands = await ssg.generateBuildCommands(filePaths, { readFile: readFileMock });
	t.is(buildCommands?.install?.[0]?.value, 'npm i');
	t.is(buildCommands?.build?.[0]?.value, 'webpack');
	t.is(buildCommands?.output?.[0]?.value, 'out');
});

test('Avoid misconfigurations in settings files', async (t) => {
	const ssg = new Ssg();
	const readWeirdFile = () => `{
        "buildCommand": ["webpack"],
        "installCommand": true,
        "outputDirectory": 5
    }`;
	const buildCommands = await ssg.generateBuildCommands(['vercel.json'], {
		readFile: readWeirdFile,
	});
	t.falsy(buildCommands?.install?.length);
	t.falsy(buildCommands?.build?.length);
	t.falsy(buildCommands?.output?.length);
});
