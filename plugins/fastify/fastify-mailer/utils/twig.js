/**
 * Fastify twig renderer utility module
 * @author Junaid Atari <mj.atari@gmail.com>
 * @link https://github.com/blacksmoke26 Author Website
 * @since 2021-06-27
 */

/** Native/Installed modules */
const path = require('path');
const fs = require('fs');
const op = require('object-path');
const {twig} = require('twig');

/**
 * @constructor
 * @param {FastifyInstance&FastifyServer} fastify Fastify instance
 */
module.exports = fastify => {
	const genUtil = require('./general')(fastify);

	/**
	 * Resolve view name
	 * @param {string} view The view object
	 * @return string view name
	 */
	function resolveViewName ( view ) {
		return 'string' === typeof view
			? view.replace(/-(text|html)$/gi, '') + '-html.twig'
			: '';
	}

	/**
	 * Get template absolute path
	 * @param {string} to (optional) Path to append (Defaults to null)
	 * @param {Object} options (optional) {key:value} pairs of additional options, see below:
	 * <br> - string <b><i>basePath</i></b> Base path to the templates directory (Defaults to auto)<br>
	 * @returns {string} Path to the file or directory
	 */
	function toTemplatePath ( to = null, options = {} ) {
		/** @type {string} */
		const basePath = op.get(
			options,
			'basePath',
			path.resolve(`${__dirname}/../../../mail`)
		);

		const toPath = 'string' === typeof to
			? to.replace(/^\\\//, '')
			: '';

		return path.resolve(`${basePath}/${toPath}`);
	}

	/**
	 * Get file contents
	 * @param {string} path An absolute and valid path to the file
	 * @returns {string} File content
	 * @throws {Error} when template file does not exist
	 */
	function getFileContents ( path ) {
		if ( !fs.existsSync(path) ) {
			throw new Error('File does not exist');
		}

		return String(fs.readFileSync(path, 'utf8')).trim();
	}

	/**
	 * Normalize variables into twig variables
	 * @param {Object} vars {name:value} pairs of raw variables
	 * @returns {Object} {name:value} pairs of variables
	 */
	function normalizeVariables ( vars = {} ) {
		return genUtil.normalizeVariables(vars);
	}

	/**
	 * Filter and replace all % variables with twig variables
	 * @param {string} content Raw contents
	 * @returns {string} Filtered text
	 */
	function filterContentVars ( content ) {
		return 'string' !== typeof content
			? ''
			: content.replace(/%([a-zA-Z]+)%/gi, '{{$1}}');
	}

	/**
	 * Render twig text
	 * @see renderLayout options.layoutOptions options
	 * @param {string} content Twig text
	 * @param {Object} vars (optional) {name:value} pairs of variables to replace from content
	 * @param {Object} options (optional) {key:value} pairs of additional options, see below:
	 * <br> - string <b><i>layout</i></b> Layout file name (e.g., html,text) (Defaults to '')<br>
	 * <br> - object <b><i>layoutOptions</i></b> {key:value} pairs of layout options (Defaults to {})<br>
	 * @returns {string} Rendered contents
	 */
	function renderText ( content, vars = {}, options = {} ) {
		options = {
			layout: '',
			layoutOptions: {},
			...options,
		};
		
		/** @type {layout} */
		const layout = String(options.layout || '').trim();

		/** @type {Object} */
		const layoutOptions = options.layoutOptions || {};

		/** @type {Object} */
		const template = twig({
			data: content,
		});

		const contents = template.render(
			normalizeVariables(vars)
		);
		
		return !layout
			? contents
			: renderLayout(layout, contents, vars, layoutOptions);
	}

	/**
	 * Render twig file
	 * @see renderLayout options.layoutOptions options
	 * @param {string} path An absolute and valid path to the file including .twig extension
	 * @param {Object} vars (optional) {name:value} pairs of variables to replace from content
	 * @param {Object} options (optional) {key:value} pairs of additional options, see below:
	 * <br> - string <b><i>layout</i></b> Layout file name (e.g., html,text) (Defaults to '')<br>
	 * <br> - object <b><i>layoutOptions</i></b> {key:value} pairs of layout options (Defaults to {})<br>
	 * @returns {string} File content
	 * @throws {Error} when template file does not exist
	 */
	function renderFile ( path, vars = {}, options = {} ) {
		return renderText(getFileContents(path), vars, options);
	}

	/**
	 * Render twig layout file
	 * @param {string} name Layout file name (e.g., html,text)
	 * @param {string} content Message Contents
	 * @param {Object} vars (optional) {name:value} pairs of variables to replace from content
	 * @param {Object} options (optional) {key:value} pairs of additional options, see below:
	 * <br> - string <b><i>lang</i></b> Language name, [ur, en, th] or [ur-PK, en-US] (Defaults to 'en')<br>
	 * <br> - string <b><i>title</i></b> Document title (Defaults to '(no subject)')<br>
	 * @returns {string} Rendered file content
	 * @throws {Error} when template file does not exist
	 */
	function renderLayout ( name, content, vars = {}, options = {} ) {
		options = {
			lang: '',
			title: '',
			...options,
		};
		
		/** @type {Object} */
		const variables = normalizeVariables(vars);
		/** @type {string} */
		const contents = getFileContents(toTemplatePath(`layouts/${name}.twig`));

		return renderText(contents, {
			lang: genUtil.langIso2Id(options.lang || 'en'),
			title: options.title || variables.subject || '(no subject)',
			content,
		}, variables);
	}

	/**
	 * Get rendered twig template contents
	 * @param {string} name Mail template (e.g., xx-html, xx-text where xx is the file name without after string)
	 * @param {Object} vars (optional) {name:value} pairs of variables to replace from content
	 * @param {Object} options (optional) {key:value} pairs of additional options, see below:
	 * <br> - string <b><i>layout</i></b> Layout file name (e.g., html,text) (Defaults to '')<br>
	 * <br> - object <b><i>layoutOptions</i></b> {key:value} pairs of layout options (Defaults to {})<br>
	 * @returns {string} Rendered file content
	 * @throws {Error} when template file does not exist
	 */
	function renderTemplateFile ( name, vars = {}, options = {} ) {
		/** @type {string} */
		const file = toTemplatePath (resolveViewName(name));
		return renderFile(file, vars, options);
	}

	return {
		resolveViewName,
		toTemplatePath,
		normalizeVariables,
		filterContentVars,
		renderText,
		renderFile,
		renderLayout,
		renderTemplateFile,
	};
};
