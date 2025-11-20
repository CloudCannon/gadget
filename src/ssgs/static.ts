import Ssg, { type BuildCommands, type GenerateBuildCommandsOptions } from './ssg.ts';

export default class Static extends Ssg {
	constructor() {
		super('static');
	}

	configPaths(): string[] {
		return super.configPaths().concat(['.nojekyll']);
	}

	/**
	 * Generates a list of build suggestions.
	 */
	async generateBuildCommands(
		filePaths: string[],
		options: GenerateBuildCommandsOptions
	): Promise<BuildCommands> {
		const commands = await super.generateBuildCommands(filePaths, options);

		commands.output.unshift({
			value: '.',
			attribution: 'common for static sites without build',
		});

		return commands;
	}
}
