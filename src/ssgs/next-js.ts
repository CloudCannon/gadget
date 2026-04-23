import Ssg, {
	addBuildSuggestion,
	type BuildCommands,
	type GenerateBuildCommandsOptions,
} from './ssg.ts';

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

	isIgnoredPath(filePath: string, source?: string): boolean {
		return super.isIgnoredPath(filePath, source) || filePath.includes('[');
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
			value: 'npx next build && npx next export',
			attribution: 'most common for Next.js sites',
			group: 'node',
		});

		addBuildSuggestion(commands, 'output', {
			value: 'out',
			attribution: 'most common for Next.js sites',
		});

		addBuildSuggestion(commands, 'preserved', {
			value: '.next/',
			attribution: 'recommended for Next.js sites',
		});

		return commands;
	}
}
