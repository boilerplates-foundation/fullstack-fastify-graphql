/**
 * Auth Request (optional) Fastify Plugin
 * @description Automatically sign in user if token is detected in request
 * @author Junaid Atari <mj.atari@gmail.com>
 * @link https://github.com/blacksmoke26 Author Website
 * @since 2021-06-17
 */

/** Native/Installed modules */
const fp = require('fastify-plugin');

// Modules
const {resolvePath} = require('./../../../utils/path-resolver');

/**
 * Fastify mailer plugin
 * @param {FastifyInstance&FastifyServer} fastify - Fastify instance
 * @param {Object} opts - Plugin options
 * @param {function():function} next - Next function
 * @returns {Promise<any>} - Promise instance
 */
async function main ( fastify, opts, next ) {
	const {findIdentityByToken, getTokenFromAll} = require(resolvePath('@helpers/fastify/auth/jwt-identity'))(fastify);

	/**
	 * User identifier
	 * @class FastifyIdentity
	 */
	fastify.decorate('user', {
		/**
		 * @name FastifyIdentity#isGuest
		 * @member FastifyIdentity
		 * Guest user or not
		 * @type {boolean}
		 */
		isGuest: true,
		/**
		 * @name FastifyIdentity#identity
		 * @member FastifyIdentity
		 * User model
		 * @type {?User}
		 */
		identity: null,
		/**
		 * @name FastifyIdentity#id
		 * @member FastifyIdentity
		 * @property
		 * Current user ID
		 * @type {?number}
		 */
		id: null,
	});
	
	fastify.addHook('onRequest', async ( req ) => {
		try {
			let {model} = await findIdentityByToken(getTokenFromAll(req));
			fastify.user.isGuest = model === null;
			fastify.user.id = fastify.user.isGuest ? null : model.id;
			fastify.user.identity = model;
			
		} catch ( e ) {
			fastify.user.isGuest = true;
			fastify.user.identity = null;
			fastify.user.id = null;
		}
	});
	
	next();
}

module.exports = fp(main, {
	name: 'fastify-auth-decorator'
});
