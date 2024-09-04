import Bridgetown from './bridgetown.js';
import Eleventy from './eleventy.js';
import Hugo from './hugo.js';
import Jekyll from './jekyll.js';
import NextJs from './next-js.js';
import Ssg from './ssg.js';
import Sveltekit from './sveltekit.js';
import Static from './static.js';

/** @type {Record<import('@cloudcannon/configuration-types').SsgKey, Ssg>} */
export const ssgs = {
	hugo: new Hugo(),
	jekyll: new Jekyll(),
	eleventy: new Eleventy(),
	nextjs: new NextJs(),
	astro: new Ssg('astro'),
	sveltekit: new Sveltekit(),
	bridgetown: new Bridgetown(),
	lume: new Ssg('lume'),
	mkdocs: new Ssg('mkdocs'),
	docusaurus: new Ssg('docusaurus'),
	gatsby: new Ssg('gatsby'),
	hexo: new Ssg('hexo'),
	nuxtjs: new Ssg('nuxtjs'),
	sphinx: new Ssg('sphinx'),
	static: new Static(),
	legacy: new Ssg('legacy'),
	other: new Ssg(),
};

const ssgValues = Object.values(ssgs);

/**
 * Finds the most likely SSG for a set of files.
 *
 * @param filePaths {string[]} A list of file paths.
 * @returns {Ssg} The assumed SSG.
 */
export function guessSsg(filePaths) {
	/** @type {Record<import('@cloudcannon/configuration-types').SsgKey, number>} */
	const scores = {
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
		ssgs.other,
	);
}
