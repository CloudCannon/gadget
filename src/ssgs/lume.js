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
			attribution: 'default for Lume sites'
		});
        commands.output.unshift({
			value: '_site',
			attribution: 'most common for Lume sites',
		});

		return commands;
	}
}
