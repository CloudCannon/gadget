import Ssg, { type BuildCommands, type GenerateBuildCommandsOptions } from './ssg';

export default class Lume extends Ssg {
	constructor() {
		super('lume');
	}

	partialFolders(): string[] {
		return super.partialFolders().concat(['_includes/']);
	}

	/**
	 * Generates a list of build suggestions.
	 */
	async generateBuildCommands(
		filePaths: string[],
		options: GenerateBuildCommandsOptions
	): Promise<BuildCommands> {
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
		commands.environment.DENO_DIR = {
			value: '/usr/local/__site/src/.deno_cache/',
			attribution: 'recommended for speeding up Deno installs',
		};

		return commands;
	}
}
