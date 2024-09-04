import Ssg from './ssg.js';

export default class Astro extends Ssg {
	constructor() {
		super('astro');
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

		commands.build.push({
			value: 'npx astro build',
			attribution: 'default for Astro sites',
		});
		commands.output.push({
			value: 'dist',
			attribution: 'default for Astro sites',
		});

		return commands;
	}
}
