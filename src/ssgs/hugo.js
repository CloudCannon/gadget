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
}
