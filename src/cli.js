#!/usr/bin/env node

// Ignoring for non-es6 code
// @ts-nocheck

import meow from 'meow';
import { exit } from 'process';
import { readFile } from 'fs/promises';
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

const folderPath = cli.input[0];
if (!folderPath) {
	console.error('⚠️ Please provide a folder path as input.');
	cli.showHelp();
	exit(1);
} else {
	const crawler = new fdir().withRelativePaths();
	const filePaths = await crawler.crawl(folderPath).withPromise();
	const config = await generate(filePaths, { readFile });

	console.log(JSON.stringify(config, undefined, 2));
}
