import Ssg, { type BuildCommands, type GenerateBuildCommandsOptions } from './ssg.ts';

export default class Sveltekit extends Ssg {
	constructor() {
		super('sveltekit');
	}

	configPaths(): string[] {
		return super.configPaths().concat(['svelte.config.js']);
	}

	templateExtensions(): string[] {
		return super.templateExtensions().concat(['.svelte']);
	}

	contentExtensions(): string[] {
		return super.contentExtensions().concat(['.svx']);
	}

	ignoredFolders(): string[] {
		return super.ignoredFolders().concat([
			'build/', // build output
			'.svelte-kit/', // cache
			'static/', // static assets
		]);
	}

	isIgnoredFile(filePath: string): boolean {
		return (
			super.isIgnoredFile(filePath) ||
			filePath.includes('[') ||
			filePath.includes('/+error') ||
			filePath.includes('/+layout') ||
			filePath.includes('/+server')
		);
	}

	/**
	 * Generates a list of build suggestions.
	 */
	async generateBuildCommands(
		filePaths: string[],
		options: GenerateBuildCommandsOptions
	): Promise<BuildCommands> {
		const commands = await super.generateBuildCommands(filePaths, options);

		if (filePaths.includes('vite.config.js')) {
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
