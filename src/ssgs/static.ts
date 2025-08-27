import type { CollectionConfig } from '@cloudcannon/configuration-types';
import Ssg, {
	type BuildCommands,
	type GenerateBuildCommandsOptions,
	type GenerateCollectionsConfigOptions,
} from './ssg';

export default class Static extends Ssg {
	constructor() {
		super('static');
	}

	configPaths(): string[] {
		return super.configPaths().concat(['.nojekyll']);
	}

	/**
	 * Generates collections config from a set of paths.
	 */
	generateCollectionsConfig(
		collectionPaths: string[],
		options: GenerateCollectionsConfigOptions
	): Record<string, CollectionConfig> {
		return {
			pages: this.generateCollectionConfig('pages', options?.source ?? '', {
				...options,
				collectionPaths,
			}),
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
			value: '.',
			attribution: 'common for static sites without build',
		});

		return commands;
	}
}
