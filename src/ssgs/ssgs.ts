import type { SsgKey } from '@cloudcannon/configuration-types';
import Astro from './astro';
import Bridgetown from './bridgetown';
import Eleventy from './eleventy';
import Gatsby from './gatsby';
import Hugo from './hugo';
import Jekyll from './jekyll';
import Lume from './lume';
import MkDocs from './mkdocs';
import NextJs from './next-js';
import NuxtJs from './nuxt-js';
import Ssg from './ssg';
import Static from './static';
import Sveltekit from './sveltekit';
import Docusaurus from './docusaurus';

export const ssgs: Record<SsgKey, Ssg> = {
	hugo: new Hugo(),
	jekyll: new Jekyll(),
	eleventy: new Eleventy(),
	nextjs: new NextJs(),
	astro: new Astro(),
	sveltekit: new Sveltekit(),
	bridgetown: new Bridgetown(),
	lume: new Lume(),
	mkdocs: new MkDocs(),
	docusaurus: new Docusaurus(),
	gatsby: new Gatsby(),
	hexo: new Ssg('hexo'),
	nuxtjs: new NuxtJs(),
	sphinx: new Ssg('sphinx'),
	static: new Static(),
	legacy: new Ssg('legacy'),
	other: new Ssg(),
};

const ssgValues: Ssg[] = Object.values(ssgs);

/**
 * Finds the most likely SSG for a set of files.
 */
export function guessSsg(filePaths: string[]): Ssg {
	const scores: Record<SsgKey, number> = {
		hugo: 0,
		jekyll: 0,
		eleventy: 0,
		nextjs: 0,
		astro: 0,
		sveltekit: 0,
		bridgetown: 0,
		lume: 0,
		mkdocs: 0,
		docusaurus: 0,
		gatsby: 0,
		hexo: 0,
		nuxtjs: 0,
		sphinx: 0,
		static: 0,
		legacy: 0,
		other: 0,
	};

	for (let i = 0; i < filePaths.length; i++) {
		for (let j = 0; j < ssgValues.length; j++) {
			scores[ssgValues[j].key] += ssgValues[j].getPathScore(filePaths[i]);
		}
	}

	return ssgValues.reduce(
		(previous, current) => (scores[previous.key] < scores[current.key] ? current : previous),
		ssgs.other
	);
}
