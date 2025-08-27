import Ssg, { type GenerateBuildCommandsOptions, type BuildCommands } from './ssg';

export default class NextJs extends Ssg {
	constructor() {
		super('nextjs');
	}

	configPaths(): string[] {
		return super.configPaths().concat(['next.config.js', 'next.config.mjs']);
	}

	templateExtensions(): string[] {
		return super.templateExtensions().concat(['.tsx', '.jsx']);
	}

	ignoredFolders(): string[] {
		return super.ignoredFolders().concat([
			'out/', // build output
			'.next/', // cache
			'public/', // static assets
		]);
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
