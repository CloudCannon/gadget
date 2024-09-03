import Ssg from './ssg.js';

export default class Gatsby extends Ssg {
	constructor() {
		super('gatsby');
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

        commands.build.unshift({
            value: 'npx gatsby build',
            attribution: 'default for Gatsby sites'
        });
        commands.output.unshift({
            value: 'public',
            attribution: 'default for Gatsby sites'
        });

        return commands;
    }
}
