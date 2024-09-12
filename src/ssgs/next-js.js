import Ssg from './ssg.js';

export default class NextJs extends Ssg {
	constructor() {
		super('nextjs');
	}

	configPaths() {
		return super.configPaths().concat(['next.config.js', 'next.config.mjs']);
	}

	templateExtensions() {
		return super.templateExtensions().concat(['.tsx', '.jsx']);
	}

	ignoredFolders() {
		return super.ignoredFolders().concat([
			'out/', // build output
			'.next/', // cache
			'public/', // static assets
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

		commands.build.unshift({
			value: 'npx next build && npx next export',
			attribution: 'most common for Next.js sites',
		});
		commands.output.unshift({
			value: 'out',
			attribution: 'most common for Next.js sites',
		});
		commands.preserved.push({
			value: '.next/',
			attribution: 'recommended for Next.js sites',
		});

		return commands;
	}
}
