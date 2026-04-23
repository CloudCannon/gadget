import Ssg, {
	addBuildSuggestion,
	type BuildCommands,
	type GenerateBuildCommandsOptions,
} from './ssg.ts';

export default class Gatsby extends Ssg {
	constructor() {
		super('gatsby');
	}

	configPaths(): string[] {
		return super
			.configPaths()
			.concat(['gatsby-config.js', 'gatsby-config.mjs', 'gatsby-config.ts']);
	}

	isIgnoredPath(filePath: string, source?: string): boolean {
		return super.isIgnoredPath(filePath, source) || filePath.includes('{');
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

		addBuildSuggestion(commands, 'build', {
			value: 'npx gatsby build',
			attribution: 'default for Gatsby sites',
			group: 'node',
		});

		addBuildSuggestion(commands, 'output', {
			value: 'public',
			attribution: 'default for Gatsby sites',
		});

		return commands;
	}
}
