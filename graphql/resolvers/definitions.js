/**
 * GraphQL Resolvers bootstrap
 * @author Junaid Atari <mj.atari@gmail.com>
 * @link https://github.com/blacksmoke26 Author Website
 * @since 2021-06-16
 */

// Native modules
const glob = require('glob');

/** Custom modules */
const { resolvePath } = require('./../../utils/path-resolver');

// Sub-definitions
const Query = require('./Query');
const Mutation = require('./Mutation');
const Subscription = require('./Subscription');

const {
	NonPositiveIntResolver: NonPositiveInt,
	PositiveIntResolver: PositiveInt,
	NonNegativeIntResolver: NonNegativeInt,
	NegativeIntResolver: NegativeInt,
	NonPositiveFloatResolver: NonPositiveFloat,
	PositiveFloatResolver: PositiveFloat,
	NonNegativeFloatResolver: NonNegativeFloat,
	NegativeFloatResolver: NegativeFloat,
	EmailAddressResolver: EmailAddress,
	URLResolver: URL,
	JSONResolver: JSON,
	GraphQLDate: Date,
	GraphQLTime: Time,
	GraphQLDateTime: DateTime,
} = require('graphql-scalars');

/**
 * Graphql resolvers definitions
 * @typedef ResolversDefs
 * @type {Object}
 * @property {{string: function(Object, Object, Query~GraphQLContext, Object): Promise<any>|Error}} Query - Graphql query definitions
 * @property {{string: function(Object, Object, Mutation~GraphQLContext, Object): Promise<any>|Error}} Mutation - Graphql mutation definitions
 * @property {{string:{string: function(): *}}} Subscription - Graphql subscription definitions
 */

/**
 * Global Resolvers
 * @type {ResolversDefs}
 */
const Resolvers = {
	// == Custom Types == //
	
	// == Thirdparty custom Types == //
	JSON,
	NonPositiveInt,
	PositiveInt,
	NonNegativeInt,
	NegativeInt,
	NonPositiveFloat,
	PositiveFloat,
	NonNegativeFloat,
	NegativeFloat,
	EmailAddress,
	URL,
	
	Date, Time, DateTime,
	
	// == Query == //
	Query,
	// == Mutation == //
	Mutation,
	// == Subscription == //
	Subscription,
};

module.exports = ( fastify, opts ) => {
	/** @type {string} */
	const baseDir = resolvePath('@graphql/resolvers');
	
	/** @type {Array<string>} */
	const files = glob.sync(`${baseDir}/**/index.js`);
	
	for ( const file of files ) {
		require(file)(Resolvers, fastify, opts);
	}
	
	return Resolvers;
};
