/**
 * File System utilities
 * @author Junaid Atari <mj.atari@gmail.com>
 * @link https://github.com/blacksmoke26 Author Website
 * @since 2021-06-16
 */

/** Require modules **/
const fs = require('fs');
const path = require('path');
const Glob = require('glob');

/**
 * @public
 * @static
 * Returns directory name component of path
 * @param {string} dir - The directory path
 * @param {int} levels - (optional) The number of parent directories to go up. This must be an integer greater than 0. (Defaults to 1)
 * @return {string} - The name of the directory. If there are no slashes in path, a dot ('.') is returned,
 * indicating the current directory. Otherwise, the returned string is path with any trailing /component removed.
 */
function dirname ( dir, levels = 1 ) {
	if ( !levels ) { return dir; }

	// noinspection LoopStatementThatDoesntLoopJS
	for ( let i = 1; i <= levels; i++ ) {
		return dirname(path.dirname(dir), levels - 1);
	}
}

/**
 * @public
 * @static
 * Split given path by separator
 * @param {string} str - The input value
 * @return {Array<string>} - Slitted path chunks
 */
function splitBySep ( str = '' ) {
	return str.replace(/\\+/, '/').split('/');
}

/**
 * @public
 * @static
 * Get directory files
 * @param {string} thePath - Directory path
 * @param {Object} options - Additional options, see below:
 * @param {boolean} [options.recursive=false] - Dig in subdirectories recursively
 * @param {Array<string>} [options.ext=['js']] - Extensions to filter
 * @param {G.IOptions} [options.globOptions={}] - Extensions to filter
 * @returns {Array<string>} - List of absolute files path
 */
function getFiles ( thePath, options = {} ) {
	/** @type {string} */
	const root = path.resolve(thePath).replace(/\/$/, '');
	
	if ( !fs.existsSync(root) ) {
		return [];
	}
	
	options = {
		globOptions: {},
		recursive: false,
		ext: ['js'],
		...options,
	}
	
	/** @type {string} */
	const extMap = options.ext.map(v => v.replace(/^\./, '')).join(',');
	
	/** @type {Array<string>} */
	const pattern = [
		root,
	];
	
	options.recursive && pattern.push('/**');
	
	pattern.push(`*.${extMap}`);
	
	return Glob.sync(pattern.join('/'), {
		...options.globOptions,
		nosort: true,
		nodir: true,
		noext: false,
		dot: false,
	}).map(file => path.resolve(file));
}

/**
 * @public
 * @static
 * Map files list {filename: path}
 * @param {Array<string>} files - List of files
 * @returns {{string: string}}
 */
function mapFiles ( files ) {
	if ( !files.length ) {
		return {};
	}
	
	/** @type {{string: string}} */
	const collection = {};
	
	for ( let file of files ) {
		const name = path.basename(file, path.extname(file))
		collection[name] = file;
	}
	
	return collection;
}

/**
 * @public
 * @static
 * Get directory subdirectories list
 * @param {string} thePath - Directory path
 * @param {Object} options - Additional options, see below:
 * @param {boolean} [options.recursive=false] - Dig in subdirectories recursively
 * @param {G.IOptions} [options.globOptions={}] - Extensions to filter
 * @returns {Array<string>} - List of absolute files path
 */
function getDirs ( thePath, options = {} ) {
	/** @type {string} */
	const root = path.resolve(thePath);

	if ( !fs.existsSync(root) ) {
		return [];
	}
	
	options = {
		globOptions: {},
		recursive: false,
		...options,
	}
	
	/** @type {Array<string>} */
	const pattern = [
		root,
		'/*/'
	];
	
	options.recursive && pattern.push('**/');
	
	return Glob.sync(pattern.join(''), {
		...options.globOptions,
		nosort: true,
		absolute: true,
		noext: false,
		realpath: true,
		dot: false,
	});
}

/**
 * @public
 * @static
 * Join directories with given path
 * @param {string} path - The root path
 * @param {string} join - (optional) Text to be join with. You can specify
 * additional text via third argument, fourth argument etc.
 * @return {string} - The path to the resource
 */
function joinPath ( path, ...join ) {
	/** @type {string} */
	let joinPath = '';

	/** @type {string[]} */
	const newAry = [...join];

	if ( newAry.length ) {
		let joins = newAry.map( val => {
			return String(val || '')
				.replace(/^[\\/]+/g, '')
				.replace(/[\\/]+$/g, '');
		}).filter(el => String(el || '').trim());

		/** @type {string[]} */

		joinPath = joins.length
			? '/' + joins.join('/')
			: '';
	}

	return path.replace(/[\\/]+$/g, '') + joinPath;
}

/**
 * @static
 * @public
 * Normalize the file extension
 * @param {string} filename - The filename to normalize
 * @param {string} [ext='js'] - Extension to append in case of null
 * @return {string} - Normalized path
 */
function normalizeExt ( filename, ext = 'js' ) {
	return !path.extname(filename)
		? `${filename}.${ext.replace(/^\./, '')}`
		: filename;
}

module.exports = {
	dirname,
	splitBySep,
	normalizeExt,
	joinPath,
	getFiles,
	getDirs,
	mapFiles,
	path: __dirname
};
