import Bridgetown from './bridgetown.js';
import Eleventy from './eleventy.js';
import Hugo from './hugo.js';
import Jekyll from './jekyll.js';
import NextJs from './next-js.js';
import Ssg from './ssg.js';
import Sveltekit from './sveltekit.js';

const unknown = new Ssg('unknown');

const ssgs = [
	new Bridgetown(),
	new Eleventy(),
	new Hugo(),
	new Jekyll(),
	new NextJs(),
	new Sveltekit(),
	unknown,
];

/**
 * Finds the most likely SSG for a set of files.
 *
 * @param filePaths {string[]} A list of file paths.
 * @returns {Bridgetown | Eleventy | Hugo | Jekyll | NextJs | Sveltekit | Ssg} The assumed SSG.
 */
export function guessSsg(filePaths) {
	/** @type {Record<import('../types').SsgKey, number>} */
	const scores = {
		eleventy: 0,
		jekyll: 0,
		bridgetown: 0,
		hugo: 0,
		sveltekit: 0,
		nextjs: 0,
		unknown: 0,
	};

	for (let i = 0; i < filePaths.length; i++) {
		for (let j = 0; j < ssgs.length; j++) {
			scores[ssgs[j].key] += ssgs[j].getPathScore(filePaths[i]);
		}
	}

	return ssgs.reduce(
		(previous, current) => (scores[previous.key] < scores[current.key] ? current : previous),
		unknown,
	);
}
