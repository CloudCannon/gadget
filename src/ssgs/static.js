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
	 * @param _collectionPaths {string[]}
	 * @param options {import('../types').GenerateCollectionsConfigOptions}
	 * @returns {import('../types').CollectionsConfig}
	 */
	generateCollectionsConfig(_collectionPaths, options) {
		return {
			pages: this.generateCollectionConfig('pages', options?.source ?? ''),
		};
	}
}
