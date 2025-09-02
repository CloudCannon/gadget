import Ssg, { type BuildCommands, type GenerateBuildCommandsOptions } from './ssg';

export default class NuxtJs extends Ssg {
	constructor() {
		super('nuxtjs');
	}

	isIgnoredFile(filePath: string): boolean {
		return super.isIgnoredFile(filePath) || filePath.includes('[');
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
			value: 'npx nuxt generate',
			attribution: 'most common for Nuxt sites',
		});
		commands.output.unshift({
			value: 'dist',
			attribution: 'most common for Nuxt sites',
		});
		commands.preserved.push({
			value: '.nuxt/',
			attribution: 'recommended for Nuxt sites',
		});

		return commands;
	}
}
