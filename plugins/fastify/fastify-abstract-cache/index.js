/**
 * Fastify redis abstract caching plugin
 * @author Junaid Atari <mj.atari@gmail.com>
 * @link https://github.com/blacksmoke26 Author Website
 * @since 2021-06-15
 */

/** Native/Installed modules */
const fp = require('fastify-plugin');
const Redis = require('ioredis');

/**
 * Register a main function
 */
async function main ( fastify, opts, next ) {
	/** @type {Redis} */
	const instance = new Redis(fastify.config.get('redis', {}));
	
	const abstractCache = require('abstract-cache')({
		useAwait: true,
		driver: {
			name: 'abstract-cache-redis', // must be installed via `npm install`
			options: {client: instance}
		}
	});
	
	/**
	 * Fastify Abstract Cache
	 * @class FastifyAbstractCache
	 */

	/**
	 * @async
	 * @public
	 * @name FastifyAbstractCache#get
	 * @memberOf FastifyAbstractCache
	 * Retrieves the desired item from the cache. The returned item should be a deep copy of
	 * the stored value to prevent alterations from affecting the cache. The result should
	 * be an object with the properties
	 * @param {string} key - The key
	 * @return {Promise<{item: *, stored: Date, ttl: Number}>} - An object with the properties
	 */

	/**
	 * @async
	 * @public
	 * @name FastifyAbstractCache#has
	 * @memberOf FastifyAbstractCache
	 * Returns a boolean result indicating if the cache contains the desired key
	 * @param {string} key - The key
	 * @return {Promise<boolean>} - True when exist / False otherwise
	 */

	/**
	 * @async
	 * @public
	 * @name FastifyAbstractCache#set
	 * @memberOf FastifyAbstractCache
	 * Stores the specified value in the cache
	 * @param {string} key - The key
	 * @param {*} value - The value to be stored
	 * @param {number} ttl - The expiry time in milliseconds
	 * @return {Promise<boolean>} - True when stored / False otherwise
	 */

	/**
	 * @async
	 * @public
	 * @name FastifyAbstractCache#delete
	 * @memberOf FastifyAbstractCache
	 * Removes the specified item from the cache
	 * @param {string} key - The key
	 * @return {Promise<boolean>} - True when removed / False otherwise
	 */

	fastify
		.register(require('fastify-redis'), {client: instance})
		.register(require('fastify-caching'), {cache: abstractCache});

	next();
}

// Export plugin to module
module.exports = fp(main, {
	name: 'fastify-redis-cache'
});
