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
	 * @param collectionPaths {{ basePath: string, paths: string[] }}
	 * @param source {string | undefined}
	 * @returns {import('../types').CollectionsConfig}
	 */
	generateCollectionsConfig(collectionPaths, source) {
		const collectionsConfig = super.generateCollectionsConfig(collectionPaths, source);

		if (!Object.keys(collectionsConfig).length) {
			collectionsConfig.pages = this.generateCollectionConfig('pages', '');
		}

		return collectionsConfig;
	}
}
