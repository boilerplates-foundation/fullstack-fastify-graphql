/**
 * Application JSON configuration loader
 * @author Junaid Atari <mj.atari@gmail.com>
 * @link https://github.com/blacksmoke26 Author Website
 * @since 2021-06-16
 * @package app-config
 */

const fs = require('fs');
const merge = require('merge');
const loadJsonFile = require('load-json-file');

// Custom modules
const utils = require('./file-system');
const {isDev, isProd} = require('./environment');

/**
 * @private
 * Absolute 'config' directory path
 * @type {string} */
const CONFIG_PATH = `${utils.dirname(__dirname, 1)}/config`;

/**
 * @private
 * List map of app based json configs
 * @type {string[]|{name: string, live?: boolean, local?: boolean}}
 */
const mapJsonApp = [
	'main',
	{name: 'main-live', live: true},
	{name: 'main-local', local: true},
	'main-override',
];

/**
 * @private
 * @static
 * Normalize json map based file
 * @param {string} path Absolute Path to directory
 * @param {string|Object.<string, (string|boolean)>} file The file to be normalized
 * @returns {string} Normalized path
 * @throws {Error} when a `file` value is not string nor object.
 */
const normalizePath = ( path, file ) => {
	if ( 'string' === typeof file ) {
		return utils.normalizeExt(`${path}/${file}`, 'json');
	}
	
	const absPath = `${path}/${file.name}`;
	
	if ( isProd && file.live ) {
		return utils.normalizeExt(absPath, 'json');
	}
	
	if ( isDev && file.local ) {
		return utils.normalizeExt(absPath, 'json');
	}
};

/**
 * @private
 * @static
 * Normalize json map based file
 * @param {string} path - Absolute Path to directory
 * @param {string|string[]|Object.<string, (string|boolean)>[]} files - The file to be normalized
 * @returns {string[]} - List of normalized paths
 */
const normalizeMap = ( path, files ) => {
	if ( !Array.isArray(files) || !files.length ) {
		return [];
	}
	
	return files
		.map(f => normalizePath(path, f))
		.filter(f => String(f).trim() && fs.existsSync(f));
};

/**
 * @public
 * @static
 * Load application JSON configuration synchronously
 * @returns {Object} - Configuration object
 * @throws {Error} - There is no file to process
 */
function loadSync () {
	/** @type {string[]} */
	const files = normalizeMap(CONFIG_PATH, mapJsonApp);
	
	if ( !Array.isArray(files) || !files.length ) {
		throw new Error('There is no file to process');
	}
	
	/** @type {Object} */
	let config = {};
	
	files.forEach(file => {
		/** @type {Object} */
		const fetched = loadJsonFile.sync(file);
		config = merge.recursive(true, config, fetched);
	});
	
	return config;
}

/**
 * @public
 * @static
 * @async
 * Load application JSON configuration asynchronously
 * @returns {Promise<Object|Error>} - Promise of configuration object
 */
async function load () {
	/** @type {string[]} */
	const files = normalizeMap(CONFIG_PATH, mapJsonApp);
	
	if ( !Array.isArray(files) || !files.length ) {
		return Promise.reject('There is no file to process');
	}
	
	/** @type {Promise[]} */
	const promises = files.map(async file => loadJsonFile(file));
	
	return new Promise(( resolve, reject ) => {
		Promise.all(promises)
		.then(values => resolve(merge.recursive(true, ...values)))
		.catch(reject);
	});
}

// Visible methods
module.exports = {
	loadSync,
	load,
};
