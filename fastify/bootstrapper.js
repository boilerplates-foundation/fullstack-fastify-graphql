/**
 * Fastify server bootstrapper
 * @author Junaid Atari <mj.atari@gmail.com>
 * @link https://github.com/blacksmoke26 Author Website
 * @since 2021-06-15
 */

/** Native/Installed modules */
const fs = require('fs');

// Custom modules
const {isProd, isDev} = require('./../utils/environment');

const {
	SERVER_SSL_ENABLED = 'false',
	SERVER_SSL_PRIVATE_KEY_FILE = '', SERVER_SSL_CERTIFICATE_FILE = '',
	SERVER_SSL_FULL_CHAIN_FILE = '',
	SERVER_LOGGING = 'false',
} = process.env;

/**
 * Fastify server instance
 * @typedef FastifyServer
 * @mixes FastifyInstance
 * @property {FastifyAbstractCache} cache - Abstract cache
 * @property {FastifyJsonConfig} config - Application configuration
 * @property {FastifyDataLoader} dataLoaders - Data loaders
 * @property {FastifySequelize} db - Database instance
 * @property {FastifyFileSystem} fs - Filesystem storage
 * @property {FastifyJwt} jwt - JWT instance
 * @property {FastifyMailer} mailer - Nodemailer instance
 * @property {FastifyIdentity} user - User identifier
 */
module.exports = async () => {
	//<editor-fold desc="SSL settings">
	if ( SERVER_SSL_ENABLED === 'true' ) {
		config.https = isProd ? {
			key: fs.readFileSync(SERVER_SSL_PRIVATE_KEY_FILE), // privkey.pem
			cert: fs.readFileSync(SERVER_SSL_FULL_CHAIN_FILE), // fullchain.pem
			ca: fs.readFileSync(SERVER_SSL_CERTIFICATE_FILE), // cert.pem
		} : {
			// For local issued ssl certificate
			key: fs.readFileSync(SERVER_SSL_PRIVATE_KEY_FILE), // privkey.pem
			cert: fs.readFileSync(SERVER_SSL_CERTIFICATE_FILE), // fullchain.pem
			ca: fs.readFileSync(SERVER_SSL_CERTIFICATE_FILE), // cert.pem
		};
	}
	//</editor-fold>

	//<editor-fold desc="Fastify server/middleware configuration">
	// Require the framework and instantiate it
	const fastify = require('fastify')({
		// Access log in console (comment following line to skip)
		logger: isDev && SERVER_LOGGING !== 'false',
		// Max JSON body request size in MB
		bodyLimit: 2 * (1024 * 1024),
	});
	
	// express like middleware handler
	await fastify.register(require('fastify-express'));
	
	fastify
		//<editor-fold desc="Middleware">
		.use(require('x-xss-protection')())
		//</editor-fold>
		
		//<editor-fold desc="Custom plugins">
		.register(require('./../plugins/fastify/fastify-json-config'))
		.register(require('./../plugins/fastify/fastify-abstract-cache'))
		.register(require('./../plugins/fastify/fastify-cors'))
		.register(require('./../plugins/fastify/fastify-rate-limit'))
		.register(require('./../plugins/fastify/fastify-file-system'))
		//</editor-fold>
		
		//<editor-fold desc="Native plugins">
		.register(require('fastify-favicon'))
		.register(require('fastify-accepts'))
		.register(require('fastify-url-data'))
		.register(require('fastify-cookie'))
		.register(require('fastify-formbody'))
		.after(err => {
			if ( err ) throw err;
		})
		//</editor-fold>
		
		//<editor-fold desc="Custom plugins">
		.register(require('./../plugins/fastify/fastify-session'))
		.register(require('./../plugins/fastify/fastify-sequelize'))
		.register(require('./../plugins/fastify/fastify-jwt'))
		.register(require('./../plugins/fastify/fastify-i18n'))
		.register(require('./../plugins/fastify/fastify-auth-decorator'))
		.register(require('./../plugins/fastify/fastify-mailer'))
		
		.register(require('./../plugins/fastify/fastify-data-loaders'))
		.register(require('./../plugins/fastify/graphql/fastify-apollo-server'))
		.register(require('./../plugins/fastify/graphql/fastify-apollo-subscription'))
		
		.register(require('./../plugins/fastify/fastify-auto-routes'))
		
		.after(function (err) {
			if ( err ) throw err;
		})
	//</editor-fold>
	;
	//</editor-fold>
	
	// Export as public
	return fastify;
};
