import { joinPaths } from '../utility.js';
import Ssg from './ssg.js';

export default class Sveltekit extends Ssg {
	constructor() {
		super('sveltekit');
	}

	configPaths() {
		return super.configPaths().concat(['svelte.config.js']);
	}

	templateExtensions() {
		return super.templateExtensions().concat(['.svelte']);
	}

	contentExtensions() {
		return super.contentExtensions().concat(['.svx']);
	}

	ignoredFolders() {
		return super.ignoredFolders().concat([
			'build/', // build output
			'.svelte-kit/', // cache
			'static/', // static assets
		]);
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
		const viteConfigPath = joinPaths([options.source, 'vite.config.js']);

		if (filePaths.includes(viteConfigPath)) {
			commands.build.push({
				value: 'npx vite build',
				attribution: 'because of your `vite.config.js` file',
			});
		}

		commands.output.push({
			value: 'build',
			attribution: 'most common for SvelteKit sites',
		});

		return commands;
	}
}
