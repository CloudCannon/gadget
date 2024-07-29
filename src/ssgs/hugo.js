import Ssg from './ssg.js';

export default class Hugo extends Ssg {
	constructor() {
		super('hugo');
	}

	configPaths() {
		return super.configPaths().concat(['config.toml', 'hugo.toml', 'hugo.yaml', 'hugo.json']);
	}

	templateExtensions() {
		return [];
	}

	partialFolders() {
		return super.partialFolders().concat([
			'archetypes/', // scaffolding templates
		]);
	}

	ignoredFolders() {
		return super.ignoredFolders().concat([
			'resources/', // cache
		]);
	}

	/**
	 * Generates a collection config entry.
	 *
	 * @param key {string}
	 * @param path {string}
	 * @param basePath {string}
	 * @returns {import('@cloudcannon/configuration-types').CollectionConfig}
	 */
	generateCollectionConfig(key, path, basePath) {
		const collectionConfig = super.generateCollectionConfig(key, path, basePath);

		if (path !== basePath) {
			collectionConfig.glob =
				typeof collectionConfig.glob === 'string'
					? [collectionConfig.glob]
					: collectionConfig.glob || [];
			collectionConfig.glob.push('!_index.md');
		}

		return collectionConfig;
	}
}
