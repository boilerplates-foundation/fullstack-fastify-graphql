/**
 * Fastify mailer general utility module
 * @author Junaid Atari <mj.atari@gmail.com>
 * @link https://github.com/blacksmoke26 Author Website
 * @since 2021-06-27
 */

/** Native/Installed modules */
const Sequelize = require('sequelize');
const merge = require('merge');
const replaceString = require('replace-string');

/**
 * @constructor
 * @param {FastifyInstance&FastifyServer} fastify Fastify instance
 */
module.exports = fastify => {
	const {
		MailTemplate, MailTemplateI18n,
	} = fastify.db.models;

	/**
	 * @public
	 * @static
	 * Get predefined variable list
	 * @returns {{string: string}}
	 */
	function predefinedVariables () {
		return {
			'%webUrl%': fastify.config.get('uri.baseUrl'),
			'%company%': fastify.config.get('app.name'),
		};
	}

	/**
	 * @public
	 * @static
	 * Normalize variables into twig variables
	 * @param {{string: string}} vars - {name:value} pairs of raw variables
	 * @returns {{string: string}}
	 */
	function normalizeVariables ( vars ) {
		if ( !Array.isArray(vars) && 'object' !== typeof vars ) {
			return {};
		}

		/** @type {Object} */
		const etdVars = merge.recursive(
			true, vars || {}, predefinedVariables()
		);

		/** @type {Object} */
		let list = {};

		Object.keys(etdVars).forEach(k => {
			const key = replaceString(k, '%', '');
			list[key] = etdVars[k];
		});

		return list;
	}

	/**
	 * @public
	 * @static
	 * Replace variables from contents
	 * @param {string} contents - Contents to replace from
	 * @param {{string: string}} [list={}] - {key:value} pairs of variables
	 * @returns {string} Process contents
	 */
	function replaceVariables ( contents, list = {} ) {
		/** @type {Object} */
		const variables = normalizeVariables(list);

		let replaced = contents;
		Object.keys(variables).forEach(( k ) => {
			replaced = replaceString(replaced, k, variables[k]);
		});

		return replaced;
	}

	/**
	 * @public
	 * @static
	 * Format email address and name
	 * @param {string} email - Email address
	 * @param {?string} [name=null] - Sender name
	 * @returns {string}
	 */
	function formatEmail ( email, name = null ) {
		email = email || '';
		return null === name || !String(name).trim() ? email : `"${name}" <${email}>`;
	}

	/**
	 * @public
	 * @static
	 * Parse and format raw email(s)
	 * @param {string|Array<string>|{string: string}|Array<{string: string}>} val Mixed value
	 * @returns {string|Array<string>} Formatted email(s)
	 */
	function parseEmail ( val ) {
		if ( 'string' === typeof val ) {
			return val;
		}

		//<editor-fold desc="List of emails">
		if ( Array.isArray(val) ) {
			let list = [];
			val.forEach(v => {
				if ( 'string' === typeof v ) {
					list.push(v);
				} else if ( !Array.isArray(v) && 'object' === typeof v ) {
					const key = Object.keys(v)[0] || '';
					list.push(formatEmail(key, v[key]));
				}
			});
			return list;
		}
		//</editor-fold>

		if ( 'object' === typeof val ) {
			const key = Object.keys(val)[0];
			return formatEmail(key, val[key]);
		}
		
		return null;
	}

	/**
	 * @protected
	 * @static
	 * @async
	 * Fetch template from database
	 * @param {string} name - Template name
	 * @returns {Promise<?Object>} - Promise instance
	 */
	const fetchMailTemplate = async ( name ) => {
		return await MailTemplate.findOne({
			attributes: [
				'id',
				['html_content', 'html'],
				['text_content', 'text'],
				[Sequelize.json('config.subject'), 'subject'],
			],
			where: {name},
			raw: true,
		});
	};

	/**
	 * @public
	 * @static
	 * @async
	 * Fetch i18n template from database
	 * @param {string} templateId - English template ID
	 * @param {string} language - Language ISO code (e.g., xx-XX)
	 * @returns {Promise<?Object>} - Promise instance
	 */
	const fetchI18nMailTemplate = async ( templateId, language ) => {
		return await MailTemplateI18n.findOne({
			attributes: [
				'id',
				['html_content', 'html'],
				['text_content', 'text'],
				[Sequelize.json('config.subject'), 'subject'],
			],
			where: {
				language,
				template_id: parseInt(templateId),
			},
			raw: true,
		});
	};

	/**
	 * @public
	 * @static
	 * @async
	 * Find mail template data from database (i18n supported)
	 * @param {string} name - Template name
	 * @param {string} lang - ISO Language [xx-XX]
	 * @returns {Promise<Object>} - The data (subject, html, text)
	 */
	async function fetchTemplate ( name, lang = 'en-US' ) {
		/** @type {boolean} */
		const isI18n = 'en-US' !== lang;

		/** @type {Object} */
		let mailTemplate = await fetchMailTemplate(name);

		if ( null === mailTemplate ) {
			throw new Error('Mail template doest not exist');
		}

		if ( isI18n ) {
			/** @type {Object} */
			const i18nTemplate = await fetchI18nMailTemplate(mailTemplate.id, lang);

			if ( null !== i18nTemplate ) {
				mailTemplate = merge.recursive(true, mailTemplate, i18nTemplate);
			}
		}

		delete mailTemplate.id;
		return mailTemplate;
	}

	/**
	 * @public
	 * @static
	 * Convert language ISO code into lang ID
	 * @param {string} iso - ISO code (xx-YY)
	 * @returns {string} - Lang ID
	 */
	function langIso2Id ( iso ) {
		return 'string' !== typeof iso
			? 'en'
			: iso.replace(/^([a-z]{2})-[a-z]{2}$/, '$1');
	}

	return {
		formatEmail,
		parseEmail,
		fetchTemplate,
		langIso2Id,
		normalizeVariables,
		replaceVariables,
		predefinedVariables,
	};
};
