/**
 * Fastify dataLoaders Plugin
 * @author Junaid Atari <mj.atari@gmail.com>
 * @link https://github.com/blacksmoke26 Author Website
 * @since 2021-06-17
 */

/** Native/Installed modules */
const fp = require('fastify-plugin');
const glob = require('glob');

/**
 * @private
 * @async
 * Register a main function
 * @param {FastifyInstance|FastifyServer} fastify Fastify instance
 * @param {{name: any}} opts Plugin options
 * @param {function(): void} next Next function
 * @returns {Promise<void>}
 */
async function main ( fastify, opts, next ) {
	/**
	 * Fastify Data Loaders
	 * @class FastifyDataLoader
	 * @mixes UsersDataLoader
	 */

	/** @type {Object} */
	const loaders = {};

	/**
	 * Resolver files paths
	 * @type {Array<string>}
	 */
	const files = glob.sync(`${__dirname}/loaders/**/*.js`);
	
	for ( let file of files ) {
		require(file)(fastify, loaders);
	}

	// Add decorate property
	!fastify.hasDecorator('dataLoaders')
		&& fastify.decorate('dataLoaders', loaders);
	
	// Way to go
	next();
}

// Export plugin to module
module.exports = fp(main, {
	name: 'fastify-data-loaders'
});
