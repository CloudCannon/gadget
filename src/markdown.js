import { parseDataFile } from './utility.js';
import htmlEntities from 'he';

/** @type import('@cloudcannon/configuration-types').MarkdownSettings> */
const defaultConfig = {
    engine: 'commonmark',
    options: {}
}

/**
 * @param entityString {string}
 * @returns {string}
 */
function decodeEntity(entityString) {
    if (entityString.length === 1) {
        // assumed already decoded
        return entityString;
    }
    const entity = `&${entityString};`
        .replace(/^&&/, '&')
        .replace(/;;$/, ';'); // Jekyll config has entities without & or ;
    return htmlEntities.decode(entity);
}

/**
 * @param config {Record<string, any>}
 * @returns {import('@cloudcannon/configuration-types').MarkdownSettings}
 */
function jekyllMarkdownConfig(config) {
    const engine = config?.['markdown']?.includes('CommonMark') ? 'commonmark' : 'kramdown';
        /** @type {import('@cloudcannon/configuration-types').MarkdownSettings['options']} */
        const options = {};
        
        if (engine === 'kramdown') {
            const kramdownConfig = config?.['kramdown'] || {};
            // https://kramdown.gettalong.org/options.html
            options.heading_ids = !!kramdownConfig.auto_ids;
            options.gfm = (!kramdownConfig.input || kramdownConfig.input !== 'GFM') ? false : true;
            options.breaks = !!kramdownConfig.hard_wrap;
            const smartquotes = kramdownConfig.smart_quotes;
            if (smartquotes && typeof smartquotes === 'string') {
                options.quotes = smartquotes
                    .replace(/\s/g, '')
                    .split(',')
                    .map(decodeEntity)
                    .join('');
            }
            // https://github.com/kramdown/parser-gfm
            options.typographer = options.gfm && !kramdownConfig.gfm_quirks?.includes?.('no_auto_typographic');

            /**
             * Several options in Kramdown can be enabled implicitly if using GFM mode
             * Historically these options have been disabled in CloudCannon,
             * so I'm thinking we'll leave them disabled until explicitly set in CC config,
             * since there is no way to explicitly set them in Kramdown config.
             * e.g. strikethrough
             * attributes is a similar example
             */
        } else {
            const commonmarkConfig = config?.['commonmark'] || {};

            /** @type {(name: string) => boolean} */
            const checkOption = ((name) => {
                return commonmarkConfig.options?.includes(name.toLowerCase()) || commonmarkConfig.options?.includes(name.toUpperCase());
            })
            /** @type {(name: string) => boolean} */
            const checkExtension = ((name) => {
                return commonmarkConfig.extensions?.includes(name.toLowerCase()) || commonmarkConfig.extensions?.includes(name.toUpperCase());
            })

            // https://github.com/gjtorikian/commonmarker?tab=readme-ov-file#options
            options.gfm = checkOption('gfm_quirks');
            options.breaks = checkOption('hardbreaks');
            options.strikethrough = checkExtension('strikethrough');
            options.table = checkExtension('table');
            options.linkify = checkExtension('autolink');
            options.superscript = checkExtension('superscript');
            options.heading_ids = checkExtension('header_ids');
        }

        return {
            engine,
            options
        }
}

/**
 * @param config {Record<string, any>}
 * @returns {import('@cloudcannon/configuration-types').MarkdownSettings}
 */
function hugoMarkdownConfig(config) {
    const goldmark = config.markup?.goldmark || {};
    const { extensions, parser, renderer } = goldmark;
    const extras = extensions?.extras || {};

    /** @type {import('@cloudcannon/configuration-types').MarkdownSettings['options']} */
    const options = {
        gfm: true
    };

    // https://gohugo.io/getting-started/configuration-markup/#goldmark
    options.linkify = !!extensions?.linkify;
    options.table = !!extensions?.table;
    options.strikethrough = !!extensions?.strikethrough || !!extras?.delete?.enable;
    options.subscript = !!extras?.subscript?.enable;
    options.superscript = !!extras?.superscript?.enable;
    options.heading_ids = !!parser.autoHeadingID;
    options.breaks = !!renderer.hardWraps;
    options.xhtml = !!renderer.xhtml;
    options.attributes = !!parser.attribute?.block || !!parser.attribute?.title;
    options.typographer = !!extensions?.typographer && !extensions.typographer.disable;
    if (options.typographer) {
        const { leftDoubleQuote, leftSingleQuote, rightDoubleQuote, rightSingleQuote } = extensions.typographer
        if (leftDoubleQuote && leftSingleQuote && rightDoubleQuote && rightSingleQuote) {
            options.quotes = [leftSingleQuote, rightSingleQuote, leftDoubleQuote, rightDoubleQuote].map(decodeEntity).join('');
        }
    }

    return {
        engine: 'commonmark',
        options
    }
}


/**
 * @param configFiles {import('./types').FileSummary[]} List of input file paths.
 * @param ssgKey {import('@cloudcannon/configuration-types').SsgKey}
 * @param readFile {((path: string) => Promise<string>) | undefined}
 * @returns {Promise<import('@cloudcannon/configuration-types').MarkdownSettings>}
 */
export async function getMarkdownConfig(configFiles, ssgKey, readFile) {
    if (!ssgKey) {
        return defaultConfig;
    }

    if (ssgKey === 'jekyll' || ssgKey === 'hugo') {
        let config;
        if (readFile) {
            for (let i = 0; i < configFiles.length; i++) {
                const filePath = configFiles[i]?.filePath;
                if (filePath) {
                    config = await parseDataFile(filePath, readFile);
                    if (config) {
                        break;
                    }
                }
            }
        }
        if (!config) {
            return defaultConfig;
        }
    
        if (ssgKey === 'jekyll') {
            return jekyllMarkdownConfig(config)
        }
    
        if (ssgKey === 'hugo') {
            return hugoMarkdownConfig(config);
        }
    }


    if (ssgKey === 'eleventy') {
        return {
            engine: 'commonmark',
            options: {
                html: true
            }
        }
    }
    

    return defaultConfig;
}