import type { CollectionConfig, MarkdownSettings, Paths } from '@cloudcannon/configuration-types';
import Ssg, {
	type GenerateBuildCommandsOptions,
	type BuildCommands,
	type GenerateCollectionConfigOptions,
} from './ssg';

export default class Astro extends Ssg {
	constructor() {
		super('astro');
	}

	conventionalPathsInSource = ['src/', 'public/'];

	configPaths(): string[] {
		return ['astro.config.mjs', 'astro.config.cjs', 'astro.config.js', 'astro.config.ts'];
	}

	ignoredFolders(): string[] {
		return super.ignoredFolders().concat([
			'public/', // passthrough asset folder
			'dist/', // default output
			'.astro', // generated types
		]);
	}

	templateExtensions(): string[] {
		return super.templateExtensions().concat(['.astro', '.tsx', '.jsx', '.vue', '.svelte']);
	}

	/**
	 * Filters out collection paths that are collections, but exist in isolated locations.
	 * Used when a data folder (or similar) is causing all collections to group under one
	 * `collections_config` entry.
	 */
	filterContentCollectionPaths(
		collectionPaths: string[],
		_options: { config?: Record<string, any>; source?: string; basePath: string }
	): string[] {
		return collectionPaths.filter(
			(path) => path.startsWith('src/content') || path.startsWith('src/pages')
		);
	}

	/**
	 * Generates a collections config key from a path, avoiding existing keys.
	 */
	generateCollectionsConfigKey(
		path: string,
		collectionsConfig: Record<string, CollectionConfig>
	): string {
		const key = super.generateCollectionsConfigKey(path, collectionsConfig);

		if (key.startsWith('content_')) {
			const trimmedKey = key.replace('content_', '');
			if (!Object.prototype.hasOwnProperty.call(collectionsConfig, trimmedKey)) {
				return trimmedKey;
			}
		}

		return key;
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

		if (
			!collectionConfig.path?.startsWith('src/pages') &&
			!collectionConfig.path?.startsWith('src/content')
		) {
			collectionConfig.disable_url = true;
		}

		return collectionConfig;
	}

	/**
	 * Generates a list of build suggestions.
	 */
	async generateBuildCommands(
		filePaths: string[],
		options: GenerateBuildCommandsOptions
	): Promise<BuildCommands> {
		const commands = await super.generateBuildCommands(filePaths, options);

		commands.build.push({
			value: 'npx astro build',
			attribution: 'most common for Astro sites',
		});
		commands.output.push({
			value: 'dist',
			attribution: 'most common for Astro sites',
		});

		return commands;
	}

	/**
	 * Generates path configuration.
	 */
	getPaths(): Paths | undefined {
		return {
			...super.getPaths(),
			static: 'public',
			uploads: 'public/uploads',
		};
	}

	generateMarkdown(_config: Record<string, any> | undefined): MarkdownSettings {
		return {
			engine: 'commonmark',
			options: {
				gfm: true,
			},
		};
	}
}
