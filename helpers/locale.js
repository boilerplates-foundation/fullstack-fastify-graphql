/**
 * Locale Utility functions
 * @module locale-helper
 * @author Junaid Atari <mj.atari@gmail.com>
 * @link https://github.com/blacksmoke26 Author Website
 * @since 2021-06-17
 */

const moment = require('moment-timezone');
const localeCode = require('locale-code');

/**
 * @public
 * Check that given local code is valid or not (xx-YY)
 * @param {string} val - Value to check
 * @return {boolean} - True when valid / False otherwise
 */
function validateLocale ( val ) {
	return localeCode.validate(val);
}

/**
 * @public
 * Check that given timezone is valid or not (xx-YY)
 * @param {string} val - Value to check
 * @return {boolean} - True when valid / False otherwise
 */
function validateTimezone ( val ) {
	let list = Array.from(moment.tz.names());
	return list.includes(val);
}

/**
 * Locale Utility functions
 * @example
 * const locHelper = require('./locale-helper');
 * console.log(await imgHelper.isValidTimeZone('UTC'));
 */
module.exports = {
	validateLocale,
	validateTimezone,
};
