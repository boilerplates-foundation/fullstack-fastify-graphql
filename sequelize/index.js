/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @link https://github.com/blacksmoke26 Author Website
 * @since 2021-06-17
 */

/** Native/Installed modules */
const Sequelize = require('sequelize');

// Utils
const {getFiles, mapFiles} = require('./../utils/file-system');

/**
 * @type {SequelizeModels}
 */
const model = {};

/** @type {boolean} */
let initialized = false;

/**
 * Initializes sequelize models and their relations.
 * @param {sequelize~Instance} sequelize - Sequelize instance.
 * @param {FastifyInstance&FastifyServer} fastify - Fastify instance.
 * @returns {SequelizeModels} - Sequelize models.
 */
function init ( sequelize, fastify ) {
	/**
	 * Models Definitions
	 * @type {{string: string}}
	 */
	const definitions = mapFiles(getFiles(`${__dirname}/definition`, {
		recursive: true, ext: ['js'],
	}));
	
	// Destroy itself to prevent repeated calls and clash with a model named 'init'.
	delete module.exports.init;
	
	initialized = true;
	
	/** @type {Array<string>} */
	const modelsName = Object.keys(definitions);
	
	// Import model files and assign them to `model` object.
	modelsName.forEach(k => (model[k] = require(definitions[k])(sequelize, Sequelize, fastify)));
	
	// All models are initialized. Now connect them with relations.
	modelsName.forEach(k => require(definitions[k]).initRelations());
	
	return model;
}

// Note: While using this module, DO NOT FORGET FIRST CALL model.init(sequelize). Otherwise, you get undefined.
module.exports = model;
module.exports.init = init;
module.exports.isInitialized = initialized;
