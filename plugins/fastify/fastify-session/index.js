/**
 * Fastify session plugin
 * @author Junaid Atari <mj.atari@gmail.com>
 * @link https://github.com/blacksmoke26 Author Website
 * @since 2021-06-16
 */

/** Native/Installed modules */
const fp = require('fastify-plugin');
const Redis = require('ioredis');
const session = require('express-session');
const RedisStore = require('connect-redis')(session);

// Custom modules
const {isProd} = require('./../../../utils/environment');

// Export plugin to module
module.exports = fp(async ( fastify, opts, next ) => {
	const client = new Redis(fastify.config.get('redis', {}));
	
	fastify.register(require('fastify-session'), {
		store: new RedisStore({
			client,
			prefix: fastify.config.get('session.server.prefix')
		}),
		secret: fastify.config.get('session.server.secret'),
		cookieName: 'session_id',
		cookie: {
			path: '/',
			httpOnly : true,
			secure : isProd,
		},
		saveUninitialized: false,
	});
	
	fastify.addHook('onSend', async (request, reply) => {
		reply.header('X-Session-ID', request.session.sessionId);
	});
	
	next();
}, {
	name: 'fastify-rate-limit'
});
