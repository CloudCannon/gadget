import Ssg from './ssg.js';

export default class Jekyll extends Ssg {
	constructor() {
		super('jekyll');
	}

	configPaths() {
		return super.configPaths().concat(['_config.yml', '_config.yaml']);
	}

	templateExtensions() {
		return super.templateExtensions().concat(['.liquid']);
	}

	contentExtensions() {
		return super.contentExtensions().concat(['.html']);
	}

	partialFolders() {
		return super.partialFolders().concat(['_layouts/']);
	}

	ignoredFolders() {
		return super.ignoredFolders().concat([
			'_site/', // build output
			'.jekyll-cache/', // cache
			'.jekyll-metadata/', // cache
		]);
	}

	// _posts and _drafts excluded here as they are potentially nested deeper.
	static conventionPaths = ['_plugins/', '_includes/', '_data/', '_layouts/', '_sass/'];

	/**
	 * Attempts to find the most likely source folder for a Jekyll site.
	 *
	 * @param filePaths {string[]} List of input file paths.
	 * @returns {{ filePath?: string, conventionPath?: string }}
	 */
	_findConventionPath(filePaths) {
		for (let i = 0; i < filePaths.length; i++) {
			for (let j = 0; j < filePaths.length; j++) {
				if (
					filePaths[i].startsWith(Jekyll.conventionPaths[j]) ||
					filePaths[i].includes(Jekyll.conventionPaths[j])
				) {
					return {
						filePath: filePaths[i],
						conventionPath: Jekyll.conventionPaths[j],
					};
				}
			}
		}

		return {};
	}

	/**
	 * Attempts to find the most likely source folder for a Jekyll site.
	 *
	 * @param _files {import('../types').ParsedFiles}
	 * @param filePaths {string[]} List of input file paths.
	 * @param collectionPaths {{ basePath: string, paths: string[] }}
	 * @returns {string}
	 */
	getSource(_files, filePaths, collectionPaths) {
		const { filePath, conventionPath } = this._findConventionPath(filePaths);

		if (filePath && conventionPath) {
			const conventionIndex = filePath.indexOf(conventionPath);
			return filePath.substring(0, Math.max(0, conventionIndex - 1));
		}

		return super.getSource(_files, filePaths, collectionPaths);
	}
}
