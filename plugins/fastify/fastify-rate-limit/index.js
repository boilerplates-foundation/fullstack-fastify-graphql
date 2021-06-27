/**
 * Fastify requests rate limiter
 * In case a client reaches the maximum number of allowed requests, an error will be sent to the user with the status code set to 429
 * @author Junaid Atari <mj.atari@gmail.com>
 * @link https://github.com/blacksmoke26 Author Website
 * @since 2021-06-15
 */

/** Native/Installed modules */
const fp = require('fastify-plugin');

/**
 * Register a main function
 */
async function main ( fastify, opts, next ) {
	/** @type {number} */
	const max = fastify.config.get('connection.rateLimiter.maxRequests', 100);

	/** @type {number} */
	const mins = fastify.config.get('connection.rateLimiter.timeWindow', 10);

	/** @type {number} */
	const timeWindow = (/** 1000 * 60 */ 60000) * mins;

	// Limit requests/s rate
	fastify.register(require('fastify-rate-limit'), {
		max,
		timeWindow,
		redis: fastify.redis,
	});

	next();
}

// Export plugin to module
module.exports = fp(main, {
	name: 'fastify-rate-limit'
});
