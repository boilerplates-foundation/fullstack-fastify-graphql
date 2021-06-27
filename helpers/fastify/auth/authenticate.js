/**
 * User auth helper module
 * @author Junaid Atari <mj.atari@gmail.com>
 * @link https://github.com/blacksmoke26 Author Website
 * @since 2021-06-17
 */

/** Native/Installed modules */
const op = require('object-path');
const moment = require('moment');
const createError = require('http-errors');

/**
 * @constructor
 * @param {FastifyInstance&FastifyServer} fastify fastify instance
 */
module.exports = ( fastify ) => {
	/** Auth user data loader */
	const authUsersLoader = fastify.dataLoaders.authUsers;
	
	const Cookie = require('./cookie')(fastify);
	const {getTokenFromAll, decodeToken, formatTokenTime} = require('./jwt-identity')(fastify);
	
	/**
	 * Clear auth cookies
	 * @param {FastifyRequest|FastifyRequest} request - Request instance
	 * @param {FastifyReply|FastifyResponse} reply - Response instance
	 * @param {boolean} force - Whatever remove cookie anyway
	 * @returns {Object} - Response data
	 */
	const clearAuthCookie = ( request, reply, force = true ) => {
		if ( force ) {
			Cookie.clearAuthCookie(request, reply);
			return;
		}
		
		// Clear/Delete auth cookie if the user is guest
		fastify.user.isGuest && Cookie.clearAuthCookie(request, reply);
	};
	
	/**
	 * Set auth cookie from response data
	 * @param {Object} response - Axios response
	 * @param {FastifyRequest|FastifyRequest} request - Request instance
	 * @param {FastifyReply|FastifyResponse} reply - Response instance
	 * @throws {Error} - Failed to retrieve auth token
	 */
	const setAuthCookie = ( response, request, reply ) => {
		/** @type {?string} */
		const authToken = op.get(response, 'data.data.auth_token', null);
		/** @type {?string} */
		const expiresAt = op.get(response, 'data.data.expires_at', null);
		
		if ( !authToken || !expiresAt ) {
			throw new Error(request.t('Failed to retrieve auth token'));
		}
		
		//Set auth cookie
		Cookie.setAuthCookie(reply, authToken, moment(expiresAt).valueOf());
	};
	
	/**
	 * @async
	 * Logout current user
	 * @param {FastifyRequest} request Request instance
	 * @param {FastifyResponse} reply Response instance
	 * @returns {Object} Response data
	 */
	const logout = async ( request, reply ) => {
		if ( fastify.user.isGuest ) {
			throw createError.Unauthorized();
		}
		
		const { /** @type {User} */ identity} = fastify.user;
		
		// Clear loader
		await authUsersLoader.clear(identity.auth_key);
		
		// Invalidate token
		identity.setJsonValue('security.token.invalidate', true);
		await identity.save();
		
		// Delete auth cookie
		Cookie.clearAuthCookie(request, reply);
		
		return {
			success: true,
		};
	};
	
	/**
	 * @async
	 * Get current auth token
	 * @param {FastifyRequest} request Request instance
	 * @returns {Object} Response data
	 */
	const currentToken = async request => {
		if ( fastify.user.isGuest ) {
			throw createError.Unauthorized();
		}
		
		const token = getTokenFromAll(request);
		const decoded = decodeToken(token);
		
		return {
			token,
			issued_at: formatTokenTime(decoded['iat']),
			expires_at: formatTokenTime(decoded['exp']),
		};
	};
	
	return {
		currentToken,
		clearAuthCookie,
		logout,
		setAuthCookie,
	};
};
