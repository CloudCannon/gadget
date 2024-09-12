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
}
