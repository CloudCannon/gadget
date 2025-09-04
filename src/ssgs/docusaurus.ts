import type { Paths, SnippetsImports } from '@cloudcannon/configuration-types';
import Ssg, { type BuildCommands, type GenerateBuildCommandsOptions } from './ssg';

export default class Docusaurus extends Ssg {
	constructor() {
		super('docusaurus');
	}

	configPaths(): string[] {
		return ['docusaurus.config.ts', 'docusaurus.config.js'];
	}

	// https://docusaurus.io/docs/static-assets
	ignoredFolders(): string[] {
		return super.ignoredFolders().concat(['static/', 'public/']);
	}

	/**
	 * Generates path configuration.
	 */
	getPaths(): Paths | undefined {
		return {
			...super.getPaths(),
			static: 'static',
			uploads: 'static/uploads',
		};
	}

	/**
	 * Generates a list of build suggestions.
	 */
	async generateBuildCommands(
		filePaths: string[],
		options: GenerateBuildCommandsOptions
	): Promise<BuildCommands> {
		const commands = await super.generateBuildCommands(filePaths, options);

		commands.output.unshift({
			value: 'build',
			attribution: 'most common for Docusaurus sites',
		});

		return commands;
	}

	getSnippetsImports(): SnippetsImports | undefined {
		return {
			...super.getSnippetsImports(),
			mdx: true,
			docusaurus_mdx: true,
		};
	}
}
