import Ssg from './ssg.js';

export default class Lume extends Ssg {
	constructor() {
		super('lume');
	}

	/**
	 * Generates a list of build suggestions.
	 *
	 * @param filePaths {string[]} List of input file paths.
	 * @param options {{ config?: Record<string, any>; source?: string; readFile?: (path: string) => Promise<string | undefined>; }}
	 * @returns {Promise<import('../types.js').BuildCommands>}
	 */
	async generateBuildCommands(filePaths, options) {
		const commands = await super.generateBuildCommands(filePaths, options);

		commands.build.push({
			value: 'deno task lume',
			attribution: 'most common for Lume sites',
		});
		commands.output.unshift({
			value: '_site',
			attribution: 'most common for Lume sites',
		});
		commands.preserved.push({
			value: '.deno_cache/',
			attribution: 'recommended for speeding up Deno installs',
		});
		commands.environment['DENO_DIR'] = {
			value: '/usr/local/__site/src/.deno_cache/',
			attribution: 'recommended for speeding up Deno installs',
		};

		return commands;
	}
}
