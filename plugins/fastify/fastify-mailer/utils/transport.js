/**
 * Fastify nodemailer transport module
 * @author Junaid Atari <mj.atari@gmail.com>
 * @link https://github.com/blacksmoke26 Author Website
 * @since 2021-06-27
 */

/** Native/Installed modules */
const merge = require('merge');
const mgTransport = require('nodemailer-mailgun-transport');
const nodemailer = require('nodemailer');
const op = require('object-path');

/**
 * @constructor
 * @param {FastifyInstance&FastifyServer} fastify Fastify instance
 * @param {Object} [config={}] - {key:value} pairs of configuration options (Defaults to {})
 */
module.exports = ( fastify, config = {} ) => {
	/** @type {Object} */
	const genUtil = require('./general')(fastify);

	/**
	 * @private
	 * @static
	 * Get sendmail.exe path
	 * @returns {string}
	 */
	const toSendMailPath = () => op.get(process.env, 'SENDMAIL_PATH', '') || '';

	/**
	 * @public
	 * @static
	 * Get configuration
	 * @param {?string} [key=null] - Configuration path to get
	 * @param {?any} [defaultValue=null] - Default value in case of null (Defaults to null)
	 * @returns {any} The value
	 */
	const getConfig = ( key = null, defaultValue = null ) => {
		const appConfig = merge.recursive(
			true,
			fastify.config.get('app.newsletter', {}),
			config.options || {}
		);

		return null === key || !key
			? appConfig
			: op.get(appConfig, key, defaultValue);
	};

	/**
	 * @private
	 * @static
	 * Get SMTP configuration
	 * @returns {{enabled: boolean, config: {port: number, auth: {user: string, pass: string}, host: *, secure: boolean}}}
	 */
	const getSmtpConfig = () => {
		/** @type {boolean} */
		const enabled = getConfig('smtp._enabled', false);

		/** @type {boolean} */
		const isSecure = getConfig('smtp.secure', false);

		/** @type {number} */
		const port = !isSecure
			? getConfig('smtp.port', 25)
			: 465;

		/** @type {Object} */
		const config = {
			pool: true,
			host: getConfig('smtp.host', 'mail.domain.com'),
			port: port,
			secure: isSecure,
			auth: {
				user: getConfig('smtp.username', 'admin@domain.com'),
				pass: getConfig('smtp.password', ''),
			}
		};

		return {
			enabled,
			config,
		}
	};

	/**
	 * @protected
	 * @static
	 * Create nodemailer SMTP transport
	 * @returns {Object} Mailer instance
	 */
	const createSmtpTransport = () => nodemailer.createTransport(getSmtpConfig().config);

	/**
	 * @private
	 * @static
	 * Create nodemailer gmail transport
	 * @param {Object} options {key:value} pairs of additional options
	 * @returns {Object} Mailer instance
	 */
	const createGmailTransport = ( options = {} ) => {
		return nodemailer.createTransport(merge.recursive(true,{
			pool: true,
			host: 'smtp.gmail.com',
			port: 465,
			secure: true,
			auth: {
				user: '',
				pass: '',
			}
		}, options));
	};

	/**
	 * @private
	 * @static
	 * Create nodemailer sendmail transport
	 * @returns {Object} Mailer instance
	 */
	const createSendMailTransport = () => {
		/** @type {Object} */
		const options = {
			sendmail: true,
			newline: 'unix',
			path: toSendMailPath(),
			//args: '-t -i',
		};

		return nodemailer.createTransport(options);
	};

	/**
	 * @private
	 * @static
	 * Create nodemailer Mailgun transport
	 * @returns {Object} Mailer instance
	 */
	const createMailGunTransport = () => {
		/** @type {Object} */
		const config = fastify.config.get('mailers.mailgun', {});

		return nodemailer.createTransport(mgTransport({
			auth: {
				api_key: config.key || '',
				domain: config.domain || '',
			},
		}));
	};

	/**
	 * @public
	 * @static
	 * Create nodemailer transport
	 * @returns {nodemailer.Transporter} Mailer instance
	 * @throws {Error} when unknown mailer transport
	 */
	const createTransport = () => {
		/** @type {string} */
		const mailerType = getConfig('mailer', 'mailer');

		/** @type {boolean} */
		const smtpEnabled = getConfig('smtp._enabled', false);

		if ( smtpEnabled ) {
			return createSmtpTransport();
		}

		if ( 'mailer' === mailerType ) {
			return createSendMailTransport();
		}

		if ( 'mailgun' === mailerType ) {
			return createMailGunTransport();
		}

		throw new Error ('Unknown mailer transport');
	};

	/**
	 * @public
	 * @static
	 * Get mail message options
	 * @param {Object} param - {key:value} pairs of parameters
	 * @param {Object} [options={}] - {key:value} pairs of additional options (Defaults to {})
	 * @returns {Object}
	 */
	const getMailOptions = ( param, options = {} ) => {
		/** @type {Object} */
		const mailOptions = {
			from: genUtil.formatEmail(
				getConfig('fromEmail'),
				getConfig('fromName')
			),
			headers: {
				priority: 'high',
			},
		};

		if ( getConfig('enableReplyTo', false) ) {
			mailOptions.replyTo = genUtil.formatEmail(
				getConfig('replyToEmail'),
				getConfig('replyToFrom')
			);
		}

		return merge.recursive(true, mailOptions, param, options);
	};

	return {
		createTransport,
		getMailOptions,
		getConfig,
	};
};
