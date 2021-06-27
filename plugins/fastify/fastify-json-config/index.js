/**
 * Fastify JSON config loader
 * @author Junaid Atari <mj.atari@gmail.com>
 * @link https://github.com/blacksmoke26 Author Website
 * @since 2021-06-16
 */

const fp = require('fastify-plugin');

/** Custom */
const Util = require('./utils');

/**
 * Fastify JSON app configuration loader
 * @param {FastifyInstance|FastifyServer} fastify - Fastify instance
 * @param {Object} opts - Plugin options
 * @param {function(): function} next - Next function
 * @returns {Promise<void>}
 */
async function main ( fastify, opts, next ) {
	const config = await Util.getDecoratorValue();
	
	fastify
		/**
		 * Application configuration
		 * @class FastifyJsonConfig
		 * @mixes {DecoratorValue}
		 */
		.decorate('config', config);
	
	next();
}

module.exports = fp(main, {
	name: 'fastify-json-config'
});
