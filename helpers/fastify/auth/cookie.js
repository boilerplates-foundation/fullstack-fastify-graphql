/**
 * Auth cookie utils
 * @author Junaid Atari <mj.atari@gmail.com>
 * @link https://github.com/blacksmoke26 Author Website
 * @since 2021-06-17
 */

/** Native/Installed modules */
const merge = require('merge');

/**
 * @constructor
 * @param {FastifyServer} fastify - Fastify instance
 */
module.exports = fastify => {
	/**
	 * Base attributes
	 * @type {string[]}
	 */
	const attributes = ['id', 'email', 'authorization_key', 'status'];
	
	/**
	 * @public
	 * Set a cookie
	 * @param {FastifyReply|FastifyResponse} reply - Fastify reply instance
	 * @param name - Cookie name
	 * @param value - Value to store
	 * @param {number} expiry - Expiry date (in seconds)
	 * @param {CookieSerializeOptions} [options={}] - Cookie serialize options
	 */
	function setCookie ( reply, name, value, expiry, options = {} ) {
		reply.setCookie(name, value, merge.recursive(true, {
			path: '/',
			expires: expiry || Date.now() - 3600,
			httpOnly: true,
			domain: '.' + fastify.config.get('uri.baseDomain'),
		}, options));
	}
	
	/**
	 * @public
	 * Set auth cookie
	 * @param {FastifyReply|FastifyResponse} reply - Fastify reply instance
	 * @param {string} token - The jwt token value
	 * @param {number} expiry - Expiry date (in seconds)
	 * @param {CookieSerializeOptions} [options={}] - Cookie serialize options
	 */
	function setAuthCookie ( reply, token, expiry, options = {} ) {
		setCookie(reply, 'auth_token', token, expiry, options);
	}
	
	/**
	 * @public
	 * Clear auth cookies
	 * @param {fastify#FastifyRequest|FastifyRequest} request - Fastify request instance
	 * @param {FastifyReply|FastifyResponse} reply - Fastify reply instance
	 */
	function clearAuthCookie ( request, reply ) {
		request.cookies.hasOwnProperty('auth_token') && setAuthCookie(reply, null, null);
	}
	
	return {
		attributes,
		clearAuthCookie,
		setAuthCookie,
	};
};
