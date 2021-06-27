/**
 * Fastify sequelize ORM plugin
 * @author Junaid Atari <mj.atari@gmail.com>
 * @link https://github.com/blacksmoke26 Author Website
 * @since 2021-06-15
 */

/** Native/Installed modules */
const fp = require('fastify-plugin');
const Sequelize = require('sequelize');

const {
	SEQUELIZE_LOGGING = 'false',
} = process.env;

/**
 * Register a main function
 * @param {FastifyInstance|FastifyServer} fastify fastify instance
 * @param {{string: any}} opts Plugin options
 * @param {function(): function} next Next function
 */
async function main ( fastify, opts, next ) {
	if ( !fastify.config.get('db.enabled', false) ) {
		next();
		return;
	}
	
	/**
	 * Fastify sequelize
	 * @class FastifySequelize
	 * @extends {sequelize~Sequelize}
	 * @property {SequelizeModels} models Sequelize models
	 */
	
	/** @type {sequelize~Options} */
	sequelizeOptions = {
		instance: 'db',
		autoConnect: false,
		dialect: 'postgres',
		host: fastify.config.get('db.server', 'localhost'),
		username: fastify.config.get('db.username'),
		password: fastify.config.get('db.password'),
		database: fastify.config.get('db.database'),
		logging: (SEQUELIZE_LOGGING === 'true' ? console.log : false),
		define: {
			freezeTableName: true,
			paranoid: false,
			timestamps: false,
		},
	};
	
	/** @type {sequelize.Sequelize} */
	const sequelize = new Sequelize(sequelizeOptions);
	
	// Run a query to set default timezone
	sequelize.query(`SET timezone = "${fastify.config.get('db.offsets', '+00:00')}"`);
	fastify.decorate('db', sequelize);
	
	// Initialize models relations (associations)
	require('./../../../sequelize').init(fastify.db, fastify);
	
	fastify.addHook('onClose', async ( instance, done ) => {
		await sequelize.close();
		done();
	});
	
	next();
}

// Export plugin to module
module.exports = fp(main, {
	name: 'fastify-sequelize'
});
