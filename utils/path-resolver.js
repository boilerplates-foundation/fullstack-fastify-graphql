/**
 * Path resolver utils
 * @author Junaid Atari <mj.atari@gmail.com>
 * @link https://github.com/blacksmoke26 Author Website
 * @since 2021-06-16
 */

/** Native/Installed modules */
const {normalize} = require('path');
const op = require('object-path');

/** Custom modules */
const {dirname, splitBySep} = require('./file-system');

/**
 * The base directory path
 * @type {string}
 */
const BASE_PATH = dirname(__dirname, 1);

/**
 * @public
 * Paths of system directories
 * @property {string} basePath - Application base path
 * @property {string} config - Configuration config path
 * @property {string} nodeModules - NPM node_modules path
 * @property {string} root - Application root path
 * @property {string} runtime - Application runtime path
 */
const directories = {
	basePath: BASE_PATH,
	config: `${BASE_PATH}/config`,
	nodeModules: `${BASE_PATH}/node_modules`,
	runtime: `${BASE_PATH}/runtime`,
};

/**
 * @public
 * Path aliases
 * @type {{string: string}}
 */
const aliases = {
	/** Application node directory path */
	'@basePath': BASE_PATH,
	/** Application config directory path */
	'@config': `${BASE_PATH}/config`,
	/** Application locale directory path */
	'@locale': `${BASE_PATH}/locale`,
	/** Application mail directory path */
	'@mail': `${BASE_PATH}/mail`,
	/** Application runtime directory path */
	'@runtime': `${BASE_PATH}/runtime`,
	/** Application components path */
	'@components': `${BASE_PATH}/components`,
	/** Application graphql path */
	'@graphql': `${BASE_PATH}/graphql`,
	/** Application controllers path */
	'@controllers': `${BASE_PATH}/controllers`,
	/** Application helpers path */
	'@helpers': `${BASE_PATH}/helpers`,
	/** Application plugins path */
	'@plugins': `${BASE_PATH}/plugins`,
	/** Application sequelize path */
	'@sequelize': `${BASE_PATH}/sequelize`,
	/** Application modules path */
	'@modules': `${BASE_PATH}/modules`,
};

/**
 * @public
 * Paths of system directories
 * @type {{string: string}}
 * @property {string} basePath - Application base path
 * @property {string} config - Configuration config path
 * @property {string} nodeModules - NPM node_modules path
 * @property {string} root - Application root path
 * @property {string} runtime - Application runtime path
 */
const paths = {
	...aliases,
	...directories,
};

/**
 * @public
 * @static
 * Resolve path and get absolute path
 * @param {string} path - The path to the file (supports path aliases)
 * @return {?string} - The absolute path / Not found
 */
function resolvePath ( path ) {
	const parsed = splitBySep(path);
	const thePath = op.get(paths, parsed[0], null);
	return normalize([thePath, ...parsed.splice(1)].join('/'));
}

// Export to module
module.exports = {
	directories,
	aliases,
	paths,
	resolvePath
};
