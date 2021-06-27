/**
 * Fastify server
 * @author Junaid Atari <mj.atari@gmail.com>
 * @link https://github.com/blacksmoke26 Author Website
 * @since 2021-06-15
 */

'use strict';

/** Native/Installed modules */
require('dotenv').config({path: __dirname + '/.env'});

// Utils
const {isDev} = require('./utils/environment');
const fastifyInitializer = require('./fastify/bootstrapper');

// Environment related
const {
	SERVER_ADDRESS = '127.0.0.1',
	SERVER_PORT = '9011',
} = process.env;

// Server initializer and kick starter
(async () => {
	// Create and initialize fastify instance
	const fastify = await fastifyInitializer();
	
	try {
		await fastify.listen(SERVER_PORT, SERVER_ADDRESS);
	} catch ( err ) {
		isDev && console.log(err);
		fastify.log.error(err);
		process.exit(1);
	}
})();
