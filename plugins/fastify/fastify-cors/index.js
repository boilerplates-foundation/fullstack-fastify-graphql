/**
 * Friendly CORS Fastify Plugin
 * @author Junaid Atari <mj.atari@gmail.com>
 * @link https://github.com/blacksmoke26 Author Website
 * @since 2021-06-16
 */

/** Native/Installed modules */
const fp = require('fastify-plugin');

/**
 * @private
 * Get origin from request
 * @param {FastifyInstance|FastifyServer} fastify - Fastify instance
 * @param {string} origin - Request origin
 * @return {string}
 */
const getOrigin = ( fastify, origin ) => {
	/**
	 * Whitelist origins (domains only)
	 * @type {Array<string>}
	 */
	const wlOrigins = fastify.config.get ('security.cors.allowed.origins');
	
	// Set true when non-browser request
	if ( origin === undefined ) {
		return true;
	}
	
	return wlOrigins.every(val => origin.includes(val))
		? origin
		: false;
};

/**
 * Fastify friendly CORS
 * @param {FastifyInstance|FastifyServer} fastify - Fastify instance
 * @param {Object} opts Plugin options
 * @param {function(): function} next Next function
 */
module.exports = fp(async ( fastify, opts, next ) => {
	fastify.use(require('cors')({
		optionsSuccessStatus: 204,
		preflightContinue: true,
		methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
		credentials:true,
		maxAge: fastify.config.get('security.cors.maxAge'),
		allowedHeaders: fastify.config.get('security.cors.allowed.headers').join(','),
		origin: ( origin, callback ) => {
			false !== getOrigin(fastify, origin)
				? callback(null, true)
				: callback(new Error('Not allowed by CORS'));
		}
	}));
	
	next();
}, {
	name: 'fastify-cors',
});
