import type { CollectionConfig, MarkdownSettings, Paths } from '@cloudcannon/configuration-types';
import type { ExternalConfig } from '..';
import { getDecapPaths } from '../external';
import Ssg, {
	type BuildCommands,
	type GenerateBuildCommandsOptions,
	type GenerateCollectionConfigOptions,
	type GenerateCollectionsConfigOptions,
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

	partialFolders(): string[] {
		return super.partialFolders().concat(['src/components', 'src/layouts']);
	}

	isIgnoredFile(filePath: string): boolean {
		return super.isIgnoredFile(filePath) || filePath.includes('[');
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

	isBaseCollectionPath(
		path: string,
		_collectionPaths: string[],
		_options: GenerateCollectionsConfigOptions
	): boolean {
		return path === 'src' || path === 'src/content' || path === 'src/pages';
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
	getPaths(externalConfig: ExternalConfig): Paths | undefined {
		return (
			getDecapPaths(externalConfig.decap) || {
				static: 'public',
				uploads: 'public/uploads',
			}
		);
	}

	generateMarkdown(_ssgConfig: Record<string, any> | undefined): MarkdownSettings {
		return {
			engine: 'commonmark',
			options: {
				gfm: true,
			},
		};
	}
}
