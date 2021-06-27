/**
 * GraphQL schema compiler
 * @author Junaid Atari <mj.atari@gmail.com>
 * @link https://github.com/blacksmoke26 Author Website
 * @since 2021-06-16
 */

const {normalize} = require('path');
const {SchemaDirectiveVisitor} = require('@graphql-tools/utils');
const {loadSchemaSync} = require('@graphql-tools/load');
const {GraphQLFileLoader} = require('@graphql-tools/graphql-file-loader');
const {addResolversToSchema} = require('@graphql-tools/schema');

/**
 * Schema file absolute path
 * @type {string} */
const SCHEMA_PATH = normalize(`${__dirname}/../../../../graphql/schema/**/*.graphql`);

/**
 * Make schema
 * @param {FastifyInstance|FastifyServer} fastify - Fastify instance
 * @param {Object} opts - Additional options
 */
module.exports = ( fastify, opts ) => {
	/**
	 * Custom schema directives
	 * @type {Object} */
	const schemaDirectives = require('./schema-directives');
	
	/**
	 * Combined schema
	 * @type {string} */
	const schema = loadSchemaSync(SCHEMA_PATH, {loaders: [new GraphQLFileLoader()]});
	
	/** @type {Object} */
	const resolvers = require(`./../../../../graphql/resolvers/definitions`)(fastify, opts);
	
	const schemaWithResolvers = addResolversToSchema({
		schema,
		resolvers,
	});
	
	SchemaDirectiveVisitor.visitSchemaDirectives(schemaWithResolvers, schemaDirectives);
	
	return schemaWithResolvers;
};
