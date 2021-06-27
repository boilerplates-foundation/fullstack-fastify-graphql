/**
 * Fastify routes definition file autoloader
 * @author Junaid Atari <mj.atari@gmail.com>
 * @link https://github.com/blacksmoke26 Author Website
 * @since 2021-06-16
 */

/** Native/Installed modules */
const fp = require('fastify-plugin');
const glob = require('glob');

/** Custom modules */
const {getFiles} = require('./../../../utils/file-system');
const {resolvePath} = require('./../../../utils/path-resolver');

/**
 * Fastify request
 * @extends fastify#FastifyRequest
 * @mixes i18nAPI
 * @class FastifyRequest
 * @property {{[string]: *}} query - The parsed querystring
 * @property {{[string]: *}} params - The params matching the URL
 * @property {{[string]: string}} headers - The headers
 * @property {{[string]: *}} cookies - Cookies
 * @property {string} id - The request id
 * @property {Object} log - The logger instance of the incoming request
 *
 * @property {Array<string>} languages - List ISO codes (ee-FF)
 * @property {Array<string>} regions - List of ISO codes (ee-FF)
 * @property {string} language - Request language (ee-FF)
 * @property {string} region - Request region language (ee-FF)
 * @property {string} locale - Request local iso code (ee-FF)
 */

/**
 * Translates a single phrase and adds it to locales if unknown. Returns translated parsed and substituted string.
 * @see https://www.npmjs.com/package/i18n#i18n__
 * @name FastifyRequest#t
 * @function
 * @memberof FastifyRequest
 * @param {string|{[string]: *}} phrase The phrase to translate or options for translation
 * @returns {string} The translated phrase
 */

/**
 * Plurals translation of a single phrase. Singular and plural forms will get added to locales if unknown. Returns translated
 * parsed and substituted string based on last count parameter.
 * @see https://www.npmjs.com/package/i18n#i18n__n
 * @name FastifyRequest#tn
 * @function
 * @memberof FastifyRequest
 * @param {string|object<string, string>} singular The phrase to translate or options for translation
 * @param {string|object|number} plural The phrase to translate or options for translation
 * @param {number} count The phrase to translate or options for translation
 * @returns {string} The translated phrase
 */

/**
 * Fastify response
 * @class FastifyResponse
 * @mixes FastifyReply
 * @mixes i18nAPI
 * @property {Response} res The http.ServerResponse from Node core
 * @property {FastifyInstance} context The http.ServerResponse from Node core
 */

/**
 * Send a cookie, defines a cookie to be sent along with the rest of the HTTP headers.
 * @see https://github.com/fastify/fastify-cookie
 * @name FastifyResponse#setCookie
 * @function
 * @memberof FastifyResponse
 * @param {string} name A string name for the cookie to be set
 * @param {string} value A string value for the cookie
 * @param {CookieSerializeOptions} options - An options object as described in the cookie `serialize` documentation
 * @returns {FastifyResponse} - Fastify reply instance
 */

/**
 * Plugin handler
 * @param {FastifyInstance} fastify - Fastify instance
 * @param {Object} opts - Additional options
 * @param {function(): void} next - Function to continue fastify lifecycle
 */
module.exports = fp(async ( fastify, opts, next ) => {
	/**
	 * Controllers files
	 * @type {string[]}
	 */
	const controllers = [
		/**
		 * +-----------------------------+
		 * | Global Controllers (routes) |
		 * +-----------------------------+
		 */
		...glob.sync(resolvePath('@controllers/**/*.js')),

		/**
		 * +------------------------------+
		 * | Modules' controller (routes) |
		 * +------------------------------+
		 */
		...glob.sync(resolvePath('@modules/**/*-controller.js'))
	];
	
	try {
		// Load controllers
		controllers.forEach(file => fastify.register(require(file), opts));
	} catch (err) {
		throw err;
	}

	next();
}, {
	name: 'fastify-auto-routes',
});
