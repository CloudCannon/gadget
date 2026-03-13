#!/usr/bin/env node

import { fork } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const cli = join(__dirname, '..', 'src', 'cli.ts');

const child = fork(cli, process.argv.slice(2), {
	execArgv: ['--experimental-strip-types', '--no-warnings'],
	stdio: 'inherit',
});

child.on('exit', (code) => process.exit(code ?? 0));
