import Ssg, {
	addBuildSuggestion,
	type BuildCommands,
	type GenerateBuildCommandsOptions,
} from './ssg.ts';

export default class MkDocs extends Ssg {
	constructor() {
		super('mkdocs');
	}

	conventionalPathsInSource = ['docs/'];

	configPaths(): string[] {
		return ['mkdocs.yml'];
	}

	/**
	 * Generates a list of build suggestions.
	 */
	async generateBuildCommands(
		filePaths: string[],
		options: GenerateBuildCommandsOptions
	): Promise<BuildCommands> {
		const commands = await super.generateBuildCommands(filePaths, options);
		const usePip = filePaths.includes('requirements.txt');
		const usePipEnv = filePaths.includes('Pipfile');

		addBuildSuggestion(commands, 'build', {
			value: 'mkdocs build',
			attribution: 'most common for MkDocs sites',
		});

		addBuildSuggestion(commands, 'output', {
			value: 'site',
			attribution: 'most common for MkDocs sites',
		});

		if (usePip) {
			addBuildSuggestion(commands, 'install', {
				value: 'pip install -r requirements.txt',
				attribution: 'because of your `requirements.txt` file',
				group: 'python',
			});

			commands.environment.PIP_CACHE_DIR = {
				value: '/usr/local/__site/src/.pip_cache/',
				attribution: 'recommended for speeding up pip installs',
			};

			addBuildSuggestion(commands, 'preserved', {
				value: '.pip_cache/',
				attribution: 'recommended for speeding up pip installs',
			});
		}

		if (usePipEnv) {
			addBuildSuggestion(commands, 'install', {
				value: 'pipenv install',
				attribution: 'because of your `Pipfile`',
				group: 'python',
			});

			commands.environment.PIPENV_CACHE_DIR = {
				value: '/usr/local/__site/src/.pipenv_cache/',
				attribution: 'recommended for speeding up pipenv installs',
			};

			addBuildSuggestion(commands, 'preserved', {
				value: '.pipenv_cache/',
				attribution: 'recommended for speeding up pipenv installs',
			});
		}

		return commands;
	}
}
