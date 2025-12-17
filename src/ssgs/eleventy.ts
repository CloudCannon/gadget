import type { CollectionConfig, MarkdownSettings } from '@cloudcannon/configuration-types';
import { join, stripBottomPath } from '../utility.ts';
import Ssg, {
	type BuildCommands,
	type GenerateBuildCommandsOptions,
	type GenerateCollectionConfigOptions,
	type GenerateCollectionsConfigOptions,
} from './ssg.ts';

export default class Eleventy extends Ssg {
	constructor() {
		super('eleventy');
	}

	configPaths(): string[] {
		return super
			.configPaths()
			.concat([
				'eleventy.config.js',
				'eleventy.config.mjs',
				'eleventy.config.cjs',
				'.eleventy.mjs',
				'.eleventy.cjs',
				'.eleventy.js',
			]);
	}

	templateExtensions(): string[] {
		return super
			.templateExtensions()
			.concat(['.njk', '.liquid', '.hbs', '.ejs', '.webc', '.mustache', '.haml', '.pug']);
	}

	partialFolders(): string[] {
		return super.partialFolders().concat(['_includes/']);
	}

	ignoredFolders(): string[] {
		return super.ignoredFolders().concat([
			'_site/', // build output
		]);
	}

	conventionalPathsInSource = ['_includes/', '_data/'];

	/**
	 * Attempts to find the most likely source folder.
	 */
	getSource(filePaths: string[]): string | undefined {
		const source = super.getSource(filePaths);
		if (source !== undefined) {
			return source;
		}

		const configFilePath = filePaths.find((filePath) => this.isConfigPath(filePath));
		if (configFilePath) {
			return stripBottomPath(configFilePath) || undefined;
		}
	}

	/**
	 * Generates a collection config entry.
	 */
	generateCollectionConfig(
		key: string,
		path: string,
		options: GenerateCollectionConfigOptions
	): CollectionConfig {
		const collectionConfig = super.generateCollectionConfig(key, path, options);

		if (path === '_data' || path.endsWith('/_data')) {
			collectionConfig.disable_url = true;
			collectionConfig.disable_add = true;
			collectionConfig.disable_add_folder = true;
			collectionConfig.disable_file_actions = true;
		}

		return collectionConfig;
	}

	/**
	 * Filters out collection paths that are collections, but exist in isolated locations.
	 * Used when a data folder (or similar) is causing all collections to group under one
	 * `collections_config` entry.
	 */
	filterContentCollectionPaths(
		collectionPaths: string[],
		options: GenerateCollectionsConfigOptions
	): string[] {
		const dataPath = join(options.basePath, '_data');
		return collectionPaths.filter((path) => path !== dataPath && !path.startsWith(`${dataPath}/`));
	}

	generateMarkdown(_ssgConfig: Record<string, any> | undefined): MarkdownSettings {
		return {
			engine: 'commonmark',
			options: {
				html: true,
			},
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

		commands.build.unshift({
			value: 'npx @11ty/eleventy',
			attribution: 'most common for 11ty sites',
		});
		commands.output.unshift({
			value: '_site',
			attribution: 'most common for 11ty sites',
		});
		commands.preserved.unshift({
			value: '.cache',
			attribution: 'most common for 11ty sites',
		});

		return commands;
	}
}
