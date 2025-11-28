import Ssg, { type BuildCommands, type GenerateBuildCommandsOptions } from './ssg.ts';

export default class Gatsby extends Ssg {
	constructor() {
		super('gatsby');
	}

	isIgnoredFile(filePath: string): boolean {
		return super.isIgnoredFile(filePath) || filePath.includes('{');
	}

	templateExtensions(): string[] {
		return super.templateExtensions().concat(['.tsx', '.jsx']);
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
