/**
 * FileSystem wrapper factory
 * @author Junaid Atari <mj.atari@gmail.com>
 * @link https://github.com/blacksmoke26 Author Website
 * @since 2021-06-27
 */

/** Native/Installed modules */
const op = require('object-path');

/** Custom modules */
const {joinPath} = require('../../../../utils/file-system');

const {
	TYPE_LOCAL, TYPE_SPACES,
	VISIBILITY_PUBLIC, VISIBILITY_PRIVATE,
	processFsOptions,
} = require('./utils');

/**
 * @class FastifyFileSystem
 */
class FastifyFileSystem {
	/**
	 * Class constructor
	 * @param {StorageManager} storageInstance - StorageManager instance
	 * @param {Object} config - Configuration
	 */
	constructor ( storageInstance, config ) {
		/**
		 * @const
		 * @public
		 * Local storage
		 * @name FastifyFileSystem#TYPE_LOCAL
		 * @type {number}
		 */
		this.TYPE_LOCAL = TYPE_LOCAL;
		
		/**
		 * @const
		 * @public
		 * DigitalOcean storage
		 * @name FastifyFileSystem#TYPE_SPACES
		 * @type {number}
		 */
		this.TYPE_SPACES = TYPE_SPACES;
		
		/**
		 * @const
		 * @public
		 * Visibility: public
		 * @name FastifyFileSystem#VISIBILITY_PUBLIC
		 * @type {string}
		 */
		this.VISIBILITY_PUBLIC = VISIBILITY_PUBLIC;
		
		/**
		 * @const
		 * @public
		 * @name FastifyFileSystem#VISIBILITY_PRIVATE
		 * Visibility: private
		 * @type {string}
		 */
		this.VISIBILITY_PRIVATE = VISIBILITY_PRIVATE;
		
		/**
		 * @private
		 * StorageManager instance
		 * @type {StorageManager}
		 */
		this._storageInstance = storageInstance;
		
		/**
		 * @private
		 * Configuration
		 * @type {Object}
		 */
		this._rawConfig = config;
	}
	
	/**
	 * @public
	 * Get StorageManager instance
	 * @returns {Storage}
	 */
	getInstance () {
		return this._storageInstance.disk();
	}
	
	/**
	 * @public
	 * Get configuration
	 * @param {?string} [key] (optional) Key name to return value (followed by .)
	 * @param {*} [defaultValue=null] - (optional) Default value in case of null
	 * @returns {*} Storage type
	 */
	getConfig ( key = null, defaultValue = null ) {
		return null === key
			? curConfig.config
			: op.get(this._rawConfig.config, key, defaultValue);
	}
	
	/**
	 * @public
	 * Get storage type
	 * @returns {number}
	 */
	storageType () {
		return Number(this.getConfig('type'));
	}
	
	/**
	 * @public
	 * Get base path
	 * @param {string[]} [joins] - (optional) Text to be join with.
	 * You can specify additional text via third argument, fourth argument etc
	 * @returns {string} The path
	 */
	toPath ( ...joins ) {
		const basePath = this.TYPE_LOCAL === this.storageType()
			? ''
			: this.getConfig('basePath');
		
		return joinPath(basePath, ...joins).replace(/^[\\\/]/, '');
	}
	
	/**
	 * @public
	 * Get base url
	 * @param {string[]} [joins] - (optional) Text to be join with.
	 * You can specify additional text via third argument, fourth argument etc
	 * @returns {string} The url
	 */
	toUrl ( ...joins ) {
		return joinPath(this.getConfig('baseUrl'), ...joins);
	};
	
	/**
	 * @async
	 * @public
	 * Check if a file exists
	 * @param {string} path - Path to the file
	 * @returns {boolean} True when exist / False otherwise
	 */
	async exists ( path ) {
		const {exists} = await this.getInstance().exists(this.toPath(path));
		return exists;
	};
	
	/**
	 * @async
	 * @public
	 * Read File
	 * @param {string} path - Path to the file
	 * @returns {Buffer} - The buffer
	 * @throws {Error} - File does not exist
	 */
	async get ( path ) {
		return await this.getInstance().get(this.toPath(path));
	};
	
	/**
	 * @async
	 * @public
	 * Write file
	 * @param {string} path - Path to the file
	 * @param {*} content - Contents to write
	 * @param {Object} options - (optional) Additional options, (e.g., {key:value})
	 * @param {string} [options.visibility] - File visibility (e.g., fastify.fs.VISIBILITY_*)
	 * @returns {boolean} True when written / False otherwise
	 */
	async put ( path, content, options = {} ) {
		/** @type {Object} */
		let exOptions = processFsOptions(this.storageType(), options);
		
		return this.getInstance()
			.put(this.toPath(path), content, exOptions);
	}
	
	/**
	 * @async
	 * @public
	 * Delete an existing file
	 * @param {string} path - Path to the file
	 * @param {Object} options - (optional) Additional options, (e.g., {key:value})
	 * @returns {boolean} True when deleted / False otherwise
	 * @throws {Error} - File does not exist
	 */
	async delete ( path, options = {} ) {
		/** @type {Object} */
		let exOptions = processFsOptions(this.storageType(), options);
		
		/** @type {boolean} */
		let exists = await this.exists(path);
		return exists
			? await this.getInstance().delete(this.toPath(path), exOptions)
			: false;
	}
	
	/**
	 * @async
	 * @public
	 * Move an existing file to a different location
	 * @param {string} source - Path to the source file
	 * @param {string} dest - The destination path
	 * @param {boolean} [overwrite] - if true then existing destination file will be overwritten.
	 * @param {Object} options - (optional) Additional options, (e.g., {key:value})
	 * @param {string} [options.visibility] - File visibility (e.g., fastify.fs.VISIBILITY_*)
	 * @returns {boolean} True when moved / False otherwise
	 * @throws {Error} - Source file does not exist
	 */
	async move ( source, dest, overwrite = false, options = {} ) {
		/** @type {Object} */
		let exOptions = processFsOptions(this.storageType(), options);
		
		/** @type {boolean} */
		let exists = await this.exists(dest);
		
		if ( exists ) {
			if ( !overwrite ) {
				return false;
			}
			
			await this.delete(dest);
		}
		
		return this.getInstance()
			.move(this.toPath(source), this.toPath(dest), exOptions);
	}
	
	/**
	 * @async
	 * @public
	 * Copy an existing file to a different location
	 * @param {string} source - Path to the source file
	 * @param {string} dest - The destination path
	 * @param {boolean} [overwrite] - if true then existing destination file will be overwritten.
	 * @param {Object} options - (optional) Additional options, (e.g., {key:value})
	 * @param {string} [options.visibility] - File visibility (e.g., fastify.fs.VISIBILITY_*)
	 * @returns {boolean} True when moved / False otherwise
	 * @throws {Error} - Source file does not exist
	 */
	async copy ( source, dest, overwrite = false, options = {} ) {
		/** @type {Object} */
		let exOptions = processFsOptions(this.storageType(), options);
		
		/** @type {boolean} */
		let exists = await this.exists(dest);
		
		if ( exists && !overwrite ) {
			return false;
		}
		
		if ( exists && overwrite ) {
			await this.delete(dest);
		}
		
		return await this.getInstance()
			.copy(this.toPath(source), this.toPath(dest), exOptions);
	}
}

module.exports = FastifyFileSystem;
