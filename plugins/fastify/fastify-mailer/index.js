/**
 * Fastify mailer plugin
 * @author Junaid Atari <mj.atari@gmail.com>
 * @link https://github.com/blacksmoke26 Author Website
 * @since 2021-06-27
 */

/** Native/Installed modules */
const fp = require('fastify-plugin');
const {recursive} = require('merge');

/**
 * Fastify mailer plugin
 * @param {FastifyInstance&FastifyServer} fastify - Fastify instance
 * @param {Object} opts - Plugin options
 * @param {function(): void} next - Next function
 * @returns {Promise<void>} - Promise instance
 */
async function main ( fastify, opts, next ) {
	const transUtil = require('./utils/transport')(fastify);
	const twigUtil = require('./utils/twig')(fastify);
	const genUtil = require('./utils/general')(fastify);

	/**
	 * Fastify mailer
	 * @class FastifyMailer
	 */
	const mailer = {};

	/**
	 * Nodemailer transport
	 * @type {Mail}
	 */
	let transporter;

	try {
		transporter = transUtil.createTransport();
	} catch (err) {
		return next(err);
	}

	/**
	 * @public
	 * Get configuration
	 * @memberOf FastifyMailer
	 * @name FastifyMailer#getConfig
	 * @param {string|Array<string>} [key] - Configuration path to get
	 * @param {?string} [defaultValue] - Default value in case of null
	 * @returns {any} - The value
	 */
	mailer.getConfig = ( key = null, defaultValue = null ) => {
		return transUtil.getConfig(key, defaultValue);
	};

	/**
	 * @public
	 * Get nodemailer transport
	 * @memberOf FastifyMailer
	 * @name FastifyMailer#getMailer
	 * @function
	 * @mixes Mail
	 * @returns {Mail|Object} Mailer instance
	 */
	mailer.getMailer = () => {
		return transporter;
	};
	
	/**
	 * @public
	 * @async
	 * Send email as Text message
	 * @memberOf FastifyMailer
	 * @name FastifyMailer#sendText
	 * @function
	 * @param {string|Array<string>|{string: string}|Array<{string: string}>} to - Receiver(s) email address(es)
	 * <br> You may also specify receiver name in addition to email address using format:
	 * <br> - 'user@domain.com'
	 * <br> - `{'user@domain.com': 'Test User'}`
	 * <br> - `['user@domain.com', {'user@domain.com': 'Test User'}, ...]`
	 * @param {string} subject Message subject
	 * @param {string} body Contents of message
	 * @param {object} options (optional) {key:value} pairs of additional options
	 * @param {{string: string}} options.vars {name:value} pairs of parameters to replace from content (Defaults to {})
	 * @param {string} options.layout Layout file name [e.g., html,text] (Defaults to 'text')
	 * @param {{string: string}} options.layoutOptions {key:value} pairs of layout options (Defaults to {})
	 * @param {string} options.layoutOptions.lang Language name, [ur, en, th] or [ur-PK, en-US] (Defaults to 'en')
	 * @param {string} options.layoutOptions.title Document title (Defaults to '(no subject)')
	 * @param {Mail#Options} options.mailOptions Nodemailer mail options (Defaults to {})
	 * @returns {Promise<SentMessageInfo>} - Promise instance
	 */
	mailer.sendText = async ( to, subject, body, options = {} ) => {
		/** @type {string} */
		const rendered = twigUtil.renderText(
			body,
			options.vars || {},
			recursive(true, {
				layout: 'text',
				layoutOptions: {
					title: subject,
				},
			}, options)
		);

		/** @type {Object} */
		const mailOptions = transUtil.getMailOptions({
			to: genUtil.parseEmail(to),
			subject,
			text: rendered,
		}, options.mailOptions || {});

		return transporter.sendMail(mailOptions);
	};

	/**
	 * @public
	 * @async
	 * Send email as HTML message
	 * @memberOf FastifyMailer
	 * @name FastifyMailer#sendHtml
	 * @function
	 * @param {string|Array<string>|{string: string}|Array<{string: string}>} to - Receiver(s) email address(es)
	 * <br> You may also specify receiver name in addition to email address using format:
	 * <br> - 'user@domain.com'
	 * <br> - `{'user@domain.com': 'Test User'}`
	 * <br> - `['user@domain.com', {'user@domain.com': 'Test User'}, ...]`
	 * @param {string} subject Message subject
	 * @param {string} body Contents of message
	 * @param {object} options (optional) {key:value} pairs of additional options
	 * @param {{string: string}} options.vars {name:value} pairs of parameters to replace from content (Defaults to {})
	 * @param {string} options.layout Layout file name [e.g., html,text] (Defaults to 'text')
	 * @param {{string: string}} options.layoutOptions {key:value} pairs of layout options (Defaults to {})
	 * @param {string} options.layoutOptions.lang Language name, [ur, en, th] or [ur-PK, en-US] (Defaults to 'en')
	 * @param {string} options.layoutOptions.title Document title (Defaults to '(no subject)')
	 * @param {Mail#Options} options.mailOptions Nodemailer mail options (Defaults to {})
	 * @returns {Promise<SentMessageInfo>} - Promise instance
	 */
	mailer.sendHtml = async ( to, subject, body, options = {} ) => {
		/** @type {string} */
		const rendered = twigUtil.renderText(
			body,
			options.vars || {},
			recursive(true, {
				layout: 'html',
				layoutOptions: {
					title: subject,
				},
			}, options)
		);

		/** @type {Object} */
		const mailOptions = transUtil.getMailOptions({
			to: genUtil.parseEmail(to),
			subject,
			html: rendered,
		}, options.mailOptions || {});

		return transporter.sendMail(mailOptions);
	};

	/**
	 * @public
	 * @async
	 * Send email using template from database
	 * @memberOf FastifyMailer
	 * @name FastifyMailer#sendTemplate
	 * @function
	 * @param {string} name Mail template name in `mail_templates` table
	 * @param {string|Array<string>|{string: string}|Array<{string: string}>} to - Receiver(s) email address(es)
	 * <br> You may also specify receiver name in addition to email address using format:
	 * <br> - 'user@domain.com'
	 * <br> - `{'user@domain.com': 'Test User'}`
	 * <br> - `['user@domain.com', {'user@domain.com': 'Test User'}, ...]`
	 * @param {Object} params (optional) {name:value} pairs of parameters to replace from content
	 * @param {object} options (optional) {key:value} pairs of additional options
	 * @param {string} options.lang ISO Language [xx-XX] (Defaults to 'en-US')
	 * @param {string} options.layout Layout file name [e.g., html,text] (Defaults to 'text')
	 * @param {{string: string}} options.layoutOptions {key:value} pairs of layout options (Defaults to {})
	 * @param {string} options.layoutOptions.lang Language name, [ur, en, th] or [ur-PK, en-US] (Defaults to 'en')
	 * @param {string} options.layoutOptions.title Document title (Defaults to '(no subject)')
	 * @param {Mail#Options} options.mailOptions Nodemailer mail options (Defaults to {})
	 * @returns {Promise<SentMessageInfo>} - Promise instance
	 */
	mailer.sendTemplate = async ( name, to, params = {}, options = {} ) => {
		const lang = options.lang || 'en-US';

		/** @type {Object} */
		const template = await genUtil.fetchTemplate(name, lang);
		
		const subject = twigUtil.renderText(template.subject, params);

		/** @type {Object} */
		const lytOptions = recursive(true, {
			layout: 'html',
			layoutOptions: {
				title: subject,
				lang,
			},
		}, options);

		/** @type {string} */
		const renderedHtml = twigUtil.renderText(template.html || '', params, lytOptions);

		/** @type {Object} */
		const mailOptions = transUtil.getMailOptions({
			to: genUtil.parseEmail(to),
			subject,
			html: renderedHtml,
		}, options.mailOptions || {});

		return transporter.sendMail(mailOptions);
	};

	/**
	 * @public
	 * @async
	 * Send email using twig template file
	 * @memberOf FastifyMailer
	 * @name FastifyMailer#sendTemplateFile
	 * @function
	 * @param {string} name Mail Template name (e.g., xx-html, xx-text where xx is the file name without after string )
	 * @param {string|Array<string>|{string: string}|Array<{string: string}>} to - Receiver(s) email address(es)
	 * <br> You may also specify receiver name in addition to email address using format:
	 * <br> - 'user@domain.com'
	 * <br> - `{'user@domain.com': 'Test User'}`
	 * <br> - `['user@domain.com', {'user@domain.com': 'Test User'}, ...]`
	 * @param {string} subject Message subject <i>(params can be used)</i>
	 * @param {{string: string}} params (optional) {name:value} pairs of parameters to replace from content
	 * @param {object} options (optional) {key:value} pairs of additional options
	 * @param {string} options.layout Layout file name [e.g., html,text] (Defaults to 'text')
	 * @param {{string: string}} options.layoutOptions {key:value} pairs of layout options (Defaults to {})
	 * @param {string} options.layoutOptions.lang Language name, [ur, en, th] or [ur-PK, en-US] (Defaults to 'en')
	 * @param {string} options.layoutOptions.title Document title (Defaults to '(no subject)')
	 * @param {Mail#Options} options.mailOptions Nodemailer mail options (Defaults to {})
	 * @returns {Promise<SentMessageInfo>} - Promise instance
	 */
	mailer.sendTemplateFile = async ( name, to, subject, params = {}, options = {} ) => {
		/** @type {string} */
		const rendered = twigUtil.renderTemplateFile(
			name,
			params,
			recursive(true, {layout: 'html',}, options)
		);

		/** @type {Object} */
		const mailOptions = transUtil.getMailOptions({
			to: genUtil.parseEmail(to),
			subject: twigUtil.renderText(subject, params),
			html: rendered,
		}, options.mailOptions || {});

		return transporter.sendMail(mailOptions);
	};

	fastify
		.decorate('mailer', mailer)
		.addHook('onClose', close);

	next();
}

const close = ( fastify, done ) => {
	fastify.mailer.getMailer().close(done);
};

// Export plugin to module
module.exports = fp(main, {
	name: 'fastify-mailer'
});
