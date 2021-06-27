/**
 * DateTime Utility functions
 * @author Junaid Atari <mj.atari@gmail.com>
 * @link https://github.com/blacksmoke26 Author Website
 * @since 2021-06-17
 */

'use strict';

const crypto = require('crypto');

/**
 * Available hashes
 * @type {Array<string>} */
const hashes = crypto.getHashes();

/**
 * Supported hash algorithms
 * @typedef {'md5'|'sha1'|'sha256'|'sha384'|'sha512'} Algorithm
 */

/**
 * @public
 * @static
 * @namespace CryptoHelper
 * Create a hash of given value
 * @param {string|Buffer|TypedArray|DataView} value - The value
 * @param {Algorithm} algorithm='sha256' - The value
 * @returns {string} - Created Hash
 * @throws {Error} - Unsupported hash algorithm
 */
function createHash ( value, algorithm = 'sha256' ) {
	if ( !hashes.includes(algorithm) ) {
		throw new Error ('Unsupported hash algorithm');
	}
	
	return crypto
		.createHash(algorithm)
		.update(value)
		.digest('hex');
}

/**
 * @public
 * @static
 * @namespace CryptoHelper
 * Create a hash of given value
 * @param {string|Object} value - A JSON string / An Object
 * @param {Algorithm} algorithm='sha256' - The value
 * @returns {string} - The Hash;
 */
function createHashJson ( value, algorithm = 'sha256' ) {
	/** @type {string} */
	let json = typeof value === 'string'
		? value
		: JSON.stringify(value);
	
	return createHash(json, algorithm);
}

module.exports = {
	createHash,
	createHashJson,
};
