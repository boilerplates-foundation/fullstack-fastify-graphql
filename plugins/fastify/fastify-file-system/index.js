/**
 * Fastify FileSystem plugin
 * @author Junaid Atari <mj.atari@gmail.com>
 * @link https://github.com/blacksmoke26 Author Website
 * @since 2021-06-27
 */

/** Native/Installed modules */
const fp = require('fastify-plugin');
const {StorageManager} = require('@slynova/flydrive');

/** Custom modules */
const FastifyFileSystem = require('./libs/FastifyFileSystem');
const {storageTypeToId, storageInstance, getStorageConfigById} = require('./libs/utils');

/**
 * @private
 * Create a FileSystem instance
 * @param {"local"|"spaces"} [storageId] - Storage ID (Null to use current)
 * @param {FastifyInstance&FastifyServer} fastify - Fastify instance
 */
const createInstance = ( storageId, fastify ) => {
	storageId = storageId
		|| storageTypeToId(fastify.config.get('fs.currentStorage'));
	
	/** @type {Object} */
	const rawConfig = getStorageConfigById(storageId, fastify);
	
	/** @type {StorageManager} */
	const instance = storageInstance(rawConfig.id, fastify);
	
	return new FastifyFileSystem(instance, rawConfig);
};

/**
 * Fastify plugin: fastify-file-system
 * @param {FastifyInstance&FastifyServer} fastify - Fastify instance
 * @param {Object} opts - {key:value} pairs of options
 * @param {function} next - Callback function
 * @returns {Promise<void>}
 */
module.exports = fp(async ( fastify, opts, next ) => {
	fastify.decorate('fs', createInstance(null, fastify));
	next();
}, {
	name: 'fastify-file-system'
});

