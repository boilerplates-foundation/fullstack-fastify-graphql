/**
 * Fastify index controller
 * @author Junaid Atari <mj.atari@gmail.com>
 * @link https://github.com/blacksmoke26 Author Website
 * @since 2021-06-15
 */

/** Native/Installed modules */
const httpErrors = require('http-errors');

/**
 * Main controller
 * @description fastify routes
 */
module.exports = async ( fastify, opts, next ) => {
	fastify
		/**
		 * Homepage
		 * @example GET /
		 */
		.get('/', async () => httpErrors.NotFound())
		/**
		 * Server status
		 * @example GET /status
		 */
		.get('/status', async () => ({status: 'OK'}))

		/**
		 * Hack: Send 204 for all OPTIONS request
		 * @example OPTIONS /*
		 */
		.options('*', ( req, reply ) => reply.send(204))
		;

	next();
};
