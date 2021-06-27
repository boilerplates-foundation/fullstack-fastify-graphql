/**
 * GraphQL Mutation
 * @author Junaid Atari <mj.atari@gmail.com>
 * @link https://github.com/blacksmoke26 Author Website
 * @since 2021-06-16
 */

/**
 * @typedef {(Object|Object.<string, *>)} Mutation~GraphQLContext
 * GraphQL Mutation context object
 * @property {FastifyServer} app - Fastify server instance
 * @property {FastifyReply|FastifyResponse} reply - Fastify reply instance
 * @property {FastifyRequest|FastifyRequest} request - Fastify request instance
 * @property {FastifyRequest|FastifyRequest} reply.request - Fastify request instance
 */

/**
 * Mutation
 * @type {Object.<string, function(root<Object>, args<Object>, ctx<Mutation~GraphQLContext>, info<Object>): Object>}
 */
const Mutation = {};

module.exports = Mutation;
