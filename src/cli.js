#!/usr/bin/env node

// Ignoring for non-es6 code
// @ts-nocheck

import meow from 'meow';
import { exit } from 'process';
import { fdir } from 'fdir';
import { generate } from './index.js';

const cli = meow(
	`
  Usage
    $ cloudcannon-gadget <input> [options]

  Options
    --version     Print the current version

  Examples
    $ cloudcannon-gadget .
    $ cloudcannon-gadget sites/my-jekyll-site
`,
	{
		importMeta: import.meta,
	},
);

/**
 * Checks if we should skip a file at this path.
 *
 * @param filePath {string}
 * @returns {boolean}
 */
function isIgnoredPath(filePath) {
	return (
		filePath.startsWith('.git/') ||
		filePath === '.gitignore' ||
		filePath.startsWith('.github/') ||
		filePath.startsWith('.cloudcannon/') ||
		filePath.startsWith('_cloudcannon/') ||
		filePath.startsWith('cloudcannon.config.') ||
		filePath.startsWith('node_modules/') ||
		filePath.includes('/node_modules/') ||
		filePath === 'README.md' ||
		filePath === 'LICENSE' ||
		filePath.endsWith('.DS_Store') ||
		filePath.endsWith('.eslintrc.json') ||
		filePath.endsWith('tsconfig.json') ||
		filePath.endsWith('jsconfig.json') ||
		filePath.endsWith('.prettierrc.json') ||
		filePath.endsWith('package-lock.json') ||
		filePath.endsWith('package.json')
	);
}

const folderPath = cli.input[0];
if (!folderPath) {
	console.error('⚠️ Please provide a folder path as input.');
	cli.showHelp();
	exit(1);
} else {
	const crawler = new fdir().withRelativePaths().filter((filePath) => !isIgnoredPath(filePath));
	const filePaths = await crawler.crawl(folderPath).withPromise();
	const config = await generate(filePaths);

	console.debug(filePaths);
	console.log(JSON.stringify(config, undefined, 2));
}
