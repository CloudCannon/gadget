#!/usr/bin/env node

// Ignoring for non-es6 code
// @ts-nocheck

import meow from 'meow';
import { generate } from './generator.js';
import { exit } from 'process';

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
	console.log(await generate(folderPath));
}
