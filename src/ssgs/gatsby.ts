import Ssg, { type GenerateBuildCommandsOptions, type BuildCommands } from './ssg';

export default class Gatsby extends Ssg {
	constructor() {
		super('gatsby');
	}

	/**
	 * Generates a list of build suggestions.
	 */
	async generateBuildCommands(
		filePaths: string[],
		options: GenerateBuildCommandsOptions
	): Promise<BuildCommands> {
		const commands = await super.generateBuildCommands(filePaths, options);

		commands.build.unshift({
			value: 'npx gatsby build',
			attribution: 'default for Gatsby sites',
		});
		commands.output.unshift({
			value: 'public',
			attribution: 'default for Gatsby sites',
		});

		return commands;
	}
}
