/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @link https://github.com/blacksmoke26 Author Website
 * @since 2021-06-16
 */

const op = require('object-path');

// Custom modules
const AppConfig = require('./../../../utils/file-config');

/**
 * @class DecoratorValue
 */

/**
 * @public
 * @static
 * @async
 * Get rendered value of 'config' decorator
 * @return {Promise<DecoratorValue>} - Promise instance
 */
async function getDecoratorValue () {
	/** @type {Object} */
	const config = await AppConfig.load();
	
	return {
		/**
		 * Get json configuration
		 * @function
		 * @name DecoratorValue#get
		 * @memberof DecoratorValue
		 * @param {string|Array<string>|null} path=null - Deep property path (separated by .)
		 * @param {any} defaultValue=null - Default value if none
		 * @return {any} - The found data
		 */
		get: ( path, defaultValue = null ) => {
			return op.get (config, path, defaultValue);
		},
		
		/**
		 * Check that configuration has or not
		 * @function
		 * @name DecoratorValue#has
		 * @memberof DecoratorValue
		 * @param {string|Array<string>} path - Deep property path
		 * @return {boolean} - True when exist / False otherwise
		 */
		has: ( path ) => {
			return op.has(config, path);
		},
	};
}

module.exports = {
	getDecoratorValue,
};
