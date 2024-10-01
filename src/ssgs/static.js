import Ssg from './ssg.js';

export default class Static extends Ssg {
	constructor() {
		super('static');
	}

	/**
	 * @returns {string[]}
	 */
	configPaths() {
		return super.configPaths().concat(['.nojekyll']);
	}

	/**
	 * Generates collections config from a set of paths.
	 *
	 * @param collectionPaths {string[]}
	 * @param options {import('../types').GenerateCollectionsConfigOptions}
	 * @returns {import('../types').CollectionsConfig}
	 */
	generateCollectionsConfig(collectionPaths, options) {
		return {
			pages: this.generateCollectionConfig('pages', options?.source ?? '', {
				...options,
				collectionPaths,
			}),
		};
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

		commands.output.unshift({
			value: '.',
			attribution: 'common for static sites without build',
		});

		return commands;
	}
}
