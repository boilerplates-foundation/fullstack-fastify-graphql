/**
 * Graphql subscription subscribe utils
 * @author Junaid Atari <mj.atari@gmail.com>
 * @link https://github.com/blacksmoke26 Author Website
 * @since 2021-06-27
 */

const { RedisPubSub } = require('graphql-redis-subscriptions');

/**
 * @constructor
 * @param {FastifyInstance&FastifyServer} fastify fastify instance
 */
module.exports = fastify => {
	/**
	 * Pubsub Subscription instance
	 * @kind Object
	 */
	const pubSub = new RedisPubSub({connection: fastify.config.get('redis', {})});
	
	/*pubsub.asyncAuthIterator = ( messages, authPromise ) => {
		const asyncIterator = pubsub.asyncIterator(messages);
		
		return {
			next() {
				return authPromise.then(() => asyncIterator.next());
			},
			return() {
				return authPromise.then(() => asyncIterator.return());
			},
			throw(error) {
				return asyncIterator.throw(error);
			},
			[$$asyncIterator]() {
				return asyncIterator;
			},
		};
	};*/
	
	return ({
		pubSub,
	});
};
