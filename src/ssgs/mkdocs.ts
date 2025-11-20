import Ssg, { type BuildCommands, type GenerateBuildCommandsOptions } from './ssg.ts';

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

		commands.build.push({
			value: 'mkdocs build',
			attribution: 'most common for MkDocs sites',
		});
		commands.output.unshift({
			value: 'site',
			attribution: 'most common for MkDocs sites',
		});

		if (usePip) {
			commands.install.push({
				value: 'pip install -r requirements.txt',
				attribution: 'because of your `requirements.txt` file',
			});

			commands.environment.PIP_CACHE_DIR = {
				value: '/usr/local/__site/src/.pip_cache/',
				attribution: 'recommended for speeding up pip installs',
			};

			commands.preserved.push({
				value: '.pip_cache/',
				attribution: 'recommended for speeding up pip installs',
			});
		}

		if (usePipEnv) {
			commands.install.push({
				value: 'pipenv install',
				attribution: 'because of your `Pipfile`',
			});

			commands.environment.PIPENV_CACHE_DIR = {
				value: '/usr/local/__site/src/.pipenv_cache/',
				attribution: 'recommended for speeding up pipenv installs',
			};

			commands.preserved.push({
				value: '.pipenv_cache/',
				attribution: 'recommended for speeding up pipenv installs',
			});
		}

		return commands;
	}
}
