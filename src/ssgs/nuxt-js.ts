import Ssg, {
	addBuildSuggestion,
	type BuildCommands,
	type GenerateBuildCommandsOptions,
} from './ssg.ts';

export default class NuxtJs extends Ssg {
	constructor() {
		super('nuxtjs');
	}

	configPaths(): string[] {
		return super.configPaths().concat(['nuxt.config.ts']);
	}

	isIgnoredPath(filePath: string, source?: string): boolean {
		return super.isIgnoredPath(filePath, source) || filePath.includes('[');
	}

	templateExtensions(): string[] {
		return super.templateExtensions().concat(['.vue']);
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
			value: 'npx nuxt generate',
			attribution: 'most common for Nuxt sites',
			group: 'node',
		});

		addBuildSuggestion(commands, 'output', {
			value: 'dist',
			attribution: 'most common for Nuxt sites',
		});

		addBuildSuggestion(commands, 'output', {
			value: '.output/public',
			attribution: 'for Nuxt sites with "ssr" config property set to false',
		});

		addBuildSuggestion(commands, 'preserved', {
			value: '.nuxt/',
			attribution: 'recommended for Nuxt sites',
		});

		return commands;
	}
}
