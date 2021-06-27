/**
 * FileSystem utils
 * @author Junaid Atari <mj.atari@gmail.com>
 * @link https://github.com/blacksmoke26 Author Website
 * @since 2021-06-27
 */

/** Native/Installed modules */
const {StorageManager} = require('@slynova/flydrive');
const {AmazonWebServicesS3Storage} = require('@slynova/flydrive-s3');

// Custom modules
const {resolvePath} = require('./../../../../utils/path-resolver');

/**
 * @public
 * Storage types map
 * @type {Object.<number, string>}
 */
const storageTypesMap = {
	30: 'local',
	26: 'spaces',
};

/**
 * @const
 * @public
 * DigitalOcean storage
 * @type {number}
 */
const TYPE_LOCAL = 30;

/**
 * @const
 * @public
 * DigitalOcean storage
 * @type {number}
 */
const TYPE_SPACES = 26;

/**
 * @const
 * @public
 * Visibility: public
 * @type {string}
 */
const VISIBILITY_PUBLIC = 'public';

/**
 * @const
 * @public
 * Visibility: private
 * @type {string}
 */
const VISIBILITY_PRIVATE = 'private';

/**
 * @public
 * Get storage type from id
 * @param {number} type - Storage type
 * @return {string} - Storage ID
 */
function storageTypeToId ( type ) {
	return storageTypesMap[type];
}

/**
 * @public
 * Get storage id from type
 * @param {("local"|"spaces")} id - Storage ID
 * @return {number} - Storage type
 */
function storageIdToType ( id ) {
	return Object.keys(storageTypesMap)
		.find(key => storageTypesMap[Number(key)] === String(id));
}

/**
 * @public
 * Get storage configuration by ID
 * @param {"local"|"spaces"} storageId - Storage ID
 * @param {FastifyInstance|FastifyServer} fastify - Fastify instance
 * @returns {{type: number, id: string, config: Object.<string, *>}}
 */
function getStorageConfigById ( storageId, fastify ) {
	/** @type {number} */
	const type = storageIdToType(storageId);
	
	/** @type {Object.<string, *>} */
	let storageList = fastify.config.get('fs.storages');
	
	/** @type {string} */
	let key = Object.keys(storageList)
		.find(key => Number(storageList[key].type) === Number(type) );
	
	return {
		type: type,
		id: storageId,
		config: storageList[key || 'local'],
	};
}

/**
 * @public
 * Process method options
 * @param {number} storageType - Storage Type
 * @param {Object} [options] - The options
 * @returns {Object} - Processed options
 */
function processFsOptions ( storageType, options ) {
	//<editor-fold desc="Read options">
	options = options || {};
	
	if ( !options.hasOwnProperty('visibility') ) {
		return options;
	}
	
	/** @type {string} */
	const visibility = String(options.visibility || '').trim().toLowerCase();
	delete options.visibility;
	
	if ( !visibility ) {
		return options;
	}
	//</editor-fold>
	
	//<editor-fold desc="Local FileSystem">
	if ( storageType === TYPE_LOCAL ) {
		return options;
	}
	//</editor-fold>
	
	//<editor-fold desc="DigitalOcean Spaces">
	if ( storageType === TYPE_SPACES ) {
		if ( visibility === VISIBILITY_PUBLIC ) {
			options.ACL = 'public-read';
		} else if ( visibility === VISIBILITY_PRIVATE ) {
			options.ACL = 'private';
		} else {
			throw new Error ('Unknown visibility type');
		}
		
		return options;
	}
	//</editor-fold>
	
	throw new Error ('Unsupported Storage');
}

/**
 * @public
 * Get StorageManager instance
 * @param {"local"|"spaces"|string} storageId - Storage ID
 * @param {FastifyInstance&FastifyServer} fastify - Fastify instance
 * @returns {StorageManager}
 */
function storageInstance ( storageId, fastify ) {
	/** @type {{string: string|Object}} */
	const disks = {};
	
	//<editor-fold desc="Local disk">
	fastify.config.get('fs.storages.local.enabled', false) && (disks.local = {
		driver: 'local',
		config: {
			root: resolvePath(fastify.config.get('fs.storages.local.basePath')),
		},
	});
	//</editor-fold>
	
	/** @type {boolean} */
	const s3Enabled = fastify.config.get('fs.storages.spaces.enabled', false);
	
	//<editor-fold desc="DigitalOcean spaces disk">
	s3Enabled && (disks.spaces = {
		driver: 's3',
		config: {
			key: fastify.config.get('fs.storages.spaces.key'),
			secret: fastify.config.get('fs.storages.spaces.secret'),
			region: fastify.config.get('fs.storages.spaces.s3.region'),
			bucket: fastify.config.get('fs.storages.spaces.s3.bucket'),
			endpoint: fastify.config.get('fs.storages.spaces.s3.endpoint'),
			params: {
				ACL: 'public-read',
			},
		},
	});
	//</editor-fold>
	
	/** @type {{string: string|Object}} */
	const config = {
		default: storageId,
		disks,
	};
	
	/** @type {StorageManager} */
	const storage = new StorageManager(config);
	s3Enabled && storage.registerDriver('s3', AmazonWebServicesS3Storage);
	
	return storage;
}

module.exports = {
	TYPE_LOCAL,
	TYPE_SPACES,
	VISIBILITY_PUBLIC,
	VISIBILITY_PRIVATE,
	storageTypesMap,
	storageTypeToId,
	storageIdToType,
	getStorageConfigById,
	processFsOptions,
	storageInstance,
};
