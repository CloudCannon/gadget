import Ssg from './ssg.js';

export default class NuxtJs extends Ssg {
	constructor() {
		super('nuxtjs');
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
