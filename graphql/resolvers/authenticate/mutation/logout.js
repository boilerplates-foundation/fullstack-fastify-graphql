/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @link https://github.com/blacksmoke26 Author Website
 * @since 2021-06-17
 */

// Utils
const UserAuth = require('../../../../helpers/fastify/auth/authenticate');

/**
 * @param {ResolversDefs} defs - Resolvers definitions
 * @param {FastifyInstance&FastifyServer} fastify - Fastify instance
 * @return {Promise<void>} - Promise instance
 */
module.exports = async ( {Mutation, Subscription}, fastify ) => {
	const {User} = fastify.db.models;
	const {authUsers} = fastify.dataLoaders;
	
	const {clearAuthCookie} = UserAuth(fastify);
	
	const {pubSub, USER_LOGOUT} = require('./../../../subscription')(fastify);
	
	/**
	 * @public
	 * @async
	 * (Mutation) Logout current user
	 * @param {Object} root - The object that contains the result returned from the resolver on the parent field
	 * @param {Object} args - The arguments passed into the field in the query
	 * @param {Mutation~GraphQLContext} ctx - Fastify reply instance
	 * @param {Object} info - It contains information about the execution state of the query
	 * @returns {Promise<Error|boolean>}
	 * @see Uses `@auth` directive
	 */
	Mutation.logout = async ( root, args, ctx, info ) => {
		const {request, reply} = ctx;
		
		const { /** @type {User#} */ identity} = fastify.user;
		
		// Clear cookies
		clearAuthCookie(request, reply);
		
		// Clear user from dataloader
		await authUsers.clear(identity.authorization_key);
		
		// Invalidate token
		identity.setJsonValue('security.token.invalidate', true);
		await identity.save();
		
		await pubSub.publish(USER_LOGOUT, {[USER_LOGOUT]: await User.toGraphMeObject(identity)});
		
		return true;
	};
	
	Subscription[USER_LOGOUT] = {
		subscribe: () => pubSub.asyncIterator(USER_LOGOUT),
	};
};
