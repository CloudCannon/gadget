import { joinPaths } from '../utility.js';
import Ssg from './ssg.js';

export default class MkDocs extends Ssg {
	constructor() {
		super('mkdocs');
	}

	/** @type {string[]} */
	conventionalPathsInSource = ['docs/'];

	/**
	 * @returns {string[]}
	 */
	configPaths() {
		return ['mkdocs.yml'];
	}

	/**
	 * Generates a list of build suggestions.
	 *
	 * @param filePaths {string[]} List of input file paths.
	 * @param options {{ config?: Record<string, any>; source?: string; readFile?: (path: string) => Promise<string | undefined>; }}
	 * @returns {Promise<import('../types').BuildCommands>}
	 */
	async generateBuildCommands(filePaths, options) {
		const commands = await super.generateBuildCommands(filePaths, options);
		const usePip = filePaths.includes(joinPaths([options.source, 'requirements.txt']));
		const usePipEnv = filePaths.includes(joinPaths([options.source, 'Pipfile']));

		commands.build.push({
			value: 'mkdocs build',
			attribution: 'most common for MkDocs sites',
		});
		commands.output.unshift({
			value: 'site',
			attribution: 'most common for MkDocs sites',
		});

		if (usePip) {
			commands.install.push({
				value: 'pip install -r requirements.txt',
				attribution: 'because of your `requirements.txt` file',
			});

			commands.environment['PIP_CACHE_DIR'] = {
				value: '/usr/local/__site/src/.pip_cache/',
				attribution: 'recommended for speeding up pip installs',
			};

			commands.preserved.push({
				value: '.pip_cache/',
				attribution: 'recommended for speeding up pip installs',
			});
		}

		if (usePipEnv) {
			commands.install.push({
				value: 'pipenv install',
				attribution: 'because of your `Pipfile`',
			});

			commands.environment['PIPENV_CACHE_DIR'] = {
				value: '/usr/local/__site/src/.pipenv_cache/',
				attribution: 'recommended for speeding up pipenv installs',
			};

			commands.preserved.push({
				value: '.pipenv_cache/',
				attribution: 'recommended for speeding up pipenv installs',
			});
		}

		return commands;
	}
}
