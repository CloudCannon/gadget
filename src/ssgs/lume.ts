import Ssg, {
	addBuildSuggestion,
	type BuildCommands,
	type GenerateBuildCommandsOptions,
} from './ssg.ts';

export default class Lume extends Ssg {
	constructor() {
		super('lume');
	}

	configPaths(): string[] {
		return super.configPaths().concat(['_config.js', '_config.ts']);
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

		addBuildSuggestion(commands, 'build', {
			value: 'deno task lume',
			attribution: 'most common for Lume sites',
			group: 'deno',
		});

		addBuildSuggestion(commands, 'output', {
			value: '_site',
			attribution: 'most common for Lume sites',
		});

		addBuildSuggestion(commands, 'preserved', {
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
