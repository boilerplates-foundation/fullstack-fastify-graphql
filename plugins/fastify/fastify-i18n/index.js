/**
 * Fastify i18n plugin
 * @author Junaid Atari <mj.atari@gmail.com>
 * @link https://github.com/blacksmoke26 Author Website
 * @since 2021-06-15
 */

/** Native/Installed modules */
const fs = require('fs');
const i18n = require('i18n');
const fp = require('fastify-plugin');

// Custom modules
const { isProd } = require('./../../../utils/environment');

module.exports = fp(
	/**
	 * Fastify I18n
	 * @param {FastifyInstance|FastifyServer} fastify - Fastify instance
	 * @param {Object} opts - Plugin options
	 * @param {function(): void} next - Next function
	 */
	async ( fastify, opts, next ) => {
	
	/**
	 * Translations absolute path
	 * @type {string}
	 */
	const DIR_LOCALES = `${__dirname}/../../../locales/`;
	
	let localesPath = fs.existsSync(`${DIR_LOCALES}/dist/en-US.json`)
		? `${DIR_LOCALES}/dist`
		: `${DIR_LOCALES}/src`;
	
	// minimal config
	i18n.configure({
		locales: ['en-US', 'th-TH'],
		defaultLocale: 'en-US',
		autoReload: true,
		updateFiles: false,
		directory: localesPath,
		missingKeyFn ( locale, value ) {
			isProd && console.log('[i18n] => Missing key: ', value, locale);
			return value;
		},
		api: {
			__: 't',  //now req.__ becomes req.t
			__n: 'tn', //and req.__n can be called as req.tn
		},
		// setting of log level DEBUG - default to require('debug')('i18n:debug')
		logDebugFn: msg => {
			isProd && console.log('[i18n] => debug: ', msg);
		},
		
		// setting of log level WARN - default to require('debug')('i18n:warn')
		logWarnFn: msg => {
			isProd && console.log('[i18n] => warn: ', msg);
		},
		
		// setting of log level ERROR - default to require('debug')('i18n:error')
		logErrorFn: msg => {
			isProd && console.log('[i18n] => error: ', msg);
		},
	});
	
	fastify.addHook('preHandler', i18n.init);
	next();
}, {
	name: 'fastify-i18n'
});
