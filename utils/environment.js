/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @link https://github.com/blacksmoke26 Author Website
 * @since 2021-06-15
 */

/**
 * Application current environment
 * @type {string} */
const environment = String(process.env.NODE_ENV || 'development').trim().toLowerCase();

/**
 * Check that current environment is development or not.
 * @type {boolean}
 */
const isDev = environment === 'development';

/**
 * Check that current environment is production or not.
 * @type {boolean}
 */
const isProd = environment === 'production';

module.exports = {
	current : environment,
	isDev,
	isProd,
};
