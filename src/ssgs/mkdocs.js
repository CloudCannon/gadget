import Ssg from './ssg.js';

export default class MkDocs extends Ssg {
	constructor() {
		super('mkdocs');
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
			value: 'npx mkdocs build',
			attribution: 'default for MkDocs sites',
		});
		commands.output.unshift({
			value: 'site',
			attribution: 'most common for MkDocs sites',
		});

		return commands;
	}
}
