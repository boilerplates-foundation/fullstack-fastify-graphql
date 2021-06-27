/**
 * GraphQL Query
 * @author Junaid Atari <mj.atari@gmail.com>
 * @link https://github.com/blacksmoke26 Author Website
 * @since 2021-06-16
 */

/**
 * GraphQL context object
 * @typedef {Object} Query~GraphQLContext
 * @property {FastifyServer} app - Fastify server instance
 * @property {FastifyReply|FastifyResponse} reply - Fastify reply instance
 * @property {FastifyRequest|FastifyRequest} request - Fastify request instance
 * @property {FastifyRequest|FastifyRequest} reply.request - Fastify request instance
 */

/**
 * Query
 * @type {Object.<string, function(root<Object>, args<Object>, ctx<Query~GraphQLContext>, info<Object>): Object>}
 */
const Query = {};

module.exports = Query;
