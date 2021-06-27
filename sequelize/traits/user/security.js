/**
 * User account crypto utils
 * @author Junaid Atari <mj.atari@gmail.com>
 * @link https://github.com/blacksmoke26 Author Website
 * @since 2021-06-17
 */

const bcryptjs = require('bcryptjs');
const {nanoid} = require('nanoid');
const sha1 = require('sha1');
const moment = require('moment');
const {recursive} = require('merge');

/**
 * @private
 * Return current Unix timestamp
 * @param {boolean} utc=true - Time in UTC or not
 * @returns {number} Returns the current time measured in the number of seconds since the Unix Epoch (January 1 1970 00:00:00 GMT).
 */
function time ( utc = false ) {
	return utc
		? moment().utc().unix()
		: moment().unix();
}

/**
 * Method `generatePasswordHash` accepts the following options:
 * @typedef GeneratePasswordHashOptions
 * @property {number} cost - Which denotes the algorithmic cost that should be used. (Defaults to 10)
 */

/**
 * @private
 * Generates a secure hash from a password and a random salt.
 * @param {string} password - Password to verify
 * @param {GeneratePasswordHashOptions} options={} - Additional options
 * @returns {boolean} - Whether the password is correct
 */
function generatePasswordHash ( password, options = {} ) {
	/** @type {GeneratePasswordHashOptions} */
	options = recursive(true, {
		cost: 10,
	}, options);

	/** @type {string} */
	const salt = bcryptjs.genSaltSync(options.cost);

	return bcryptjs.hashSync(password, salt);
}

/**
 * security trait for sequelize user model
 * @mixin UserSecurityTrait
 * @param {sequelize~Model|User} model - User model
 */
module.exports = model => {
	/**
	 * Configuration params
	 * @type {{PasswordResetTokenLength: number, authKeyLength: number, passwordResetTokenExpire: number}}
	 */
	const params = {
		/** Password token expiry in seconds */
		passwordResetTokenExpire: 3600, // 3600 = 1 hour
		/** Password token chars length */
		PasswordResetTokenLength: 32,
		/** Authorization key chars length */
		authKeyLength: 32,
	};

	/**
	 * @public
	 * Generates password hash from password and sets it to the model
	 * @name UserSecurityTrait.setPassword
	 * @param {string} password - Password to set
	 * @returns {boolean} - Whether the password is correct
	 */
	model.prototype.setPassword = function ( password ) {
		this.set('password', sha1(password));
		this.set('password_hash', generatePasswordHash(password));
	};

	/**
	 * @public
	 * Verifies a password against a hash.
	 * @name UserSecurityTrait.validatePassword
	 * @param {string} password - Password to verify
	 * @returns {boolean} - Whether the password is correct
	 */
	model.prototype.validatePassword = function ( password ) {
		return bcryptjs.compareSync(password, this.get('password_hash'));
	};

	/**
	 * @public
	 * Generates new password reset token
	 * @name UserSecurityTrait.generatePasswordResetToken
	 */
	model.prototype.generatePasswordResetToken = function () {
		/** @type {string} */
		const code = nanoid(params.PasswordResetTokenLength);
		this.set('password_reset_token', `${code}_${time()}`);
	};

	/**
	 * Method `findByPasswordResetToken` accepts the following options:
	 * @typedef FindByPasswordResetTokenOptions
	 * @property {number} expire - password reset token expire in seconds (Defaults to 3600)
	 */

	/**
	 * @public
	 * @static
	 * @async
	 * Removes password reset token
	 * @name UserSecurityTrait.findByPasswordResetToken
	 * @param {string} token - Password reset token
	 * @param {sequelize~FindOptions} findOptions={} - Sequelize find options
	 * @param {FindByPasswordResetTokenOptions} options={} - Additional options
	 * @return {Promise<User#|null>} - Promise instance (Found record / Not found)
	 */
	model.findByPasswordResetToken = async ( token, findOptions = {}, options = {} ) => {
		/** @type {FindByPasswordResetTokenOptions} */
		options = recursive(true, {
			expire: params.passwordResetTokenExpire,
		}, options);

		/** @type {boolean} */
		const isExpired = !model.isPasswordResetTokenValid(token, options);

		if ( isExpired ) {
			return null;
		}

		/** @type {Object} */
		const seqFindOptions = recursive(true, {
			where: {
				password_reset_token: token,
			},
		}, findOptions);

		return await model.findOne(seqFindOptions);
	};

	/**
	 * Method `isPasswordResetTokenValid` accepts the following options:
	 * @typedef IsPasswordResetTokenValidOptions
	 * @property {number} expire - password reset token expire in seconds (Defaults to 3600)
	 */

	/**
	 * @public
	 * @static
	 * Finds out if password reset token is valid
	 * @name UserSecurityTrait.isPasswordResetTokenValid
	 * @param {string} token - Password reset token
	 * @param {IsPasswordResetTokenValidOptions} options={} - Additional options
	 * @return {boolean} - True when valid / False otherwise
	 */
	model.isPasswordResetTokenValid = ( token, options = {} ) => {
		/** @type {IsPasswordResetTokenValidOptions} */
		options = recursive(true, {
			expire: params.passwordResetTokenExpire,
		}, options);

		/** @type {string} */
		const theToken = String(token).trim();

		if ( !theToken ) {
			return false;
		}

		const [timestamp] = theToken.split('_').slice(-1);

		if ( !timestamp || !Number(timestamp) || isNaN(timestamp) ) {
			return false;
		}

		/** @type {number} */
		const expire = Number(timestamp) + Number(options.expire);

		return expire > time();
	};

	/**
	 * @public
	 * Removes password reset token
	 * @name UserSecurityTrait.removePasswordResetToken
	 */
	model.prototype.removePasswordResetToken = function () {
		this.set('password_reset_token', null);
	};

	/**
	 * Method `findByPasswordResetCode` accepts the following options:
	 * @typedef FindByPasswordResetCodeOptions
	 * @property {number} expire - password reset token expire in seconds (Defaults to 3600)
	 */

	/**
	 * @public
	 * @static
	 * @async
	 * Finds user by password reset code
	 * @name UserSecurityTrait.findByPasswordResetCode
	 * @param {string} code - Password reset code
	 * @param {sequelize~FindOptions} findOptions={} - Sequelize find options
	 * @param {IsPasswordResetTokenValidOptions} options={} - Additional options
	 * @return {Promise<User|null|boolean>} - Promise instance (Model instance / Not found)
	 */
	model.findByPasswordResetCode = async ( code, findOptions = {}, options = {} ) => {
		/** @type {IsPasswordResetTokenValidOptions} */
		options = recursive(true, {
			expire: params.passwordResetTokenExpire,
		}, options);

		/** @type {string} */
		const theCode = String(code).trim();

		if ( !theCode ) {
			return null;
		}

		/** @type {sequelize~FindOptions} */
		const seqFindOptions = recursive(true, {
			where: {
				password_reset_token: theCode,
				'config.password.resetCode.code::VARCHAR': theCode
			},
		}, findOptions);

		/** @type {User|null} */
		const record = await model.findOne(seqFindOptions);

		if ( record === null ) {
			return null;
		}

		/** @type {string} */
		const requestedOn = record.getJsonValue ('password.resetCode.requestedOn', '');
		
		const reqDate = moment(requestedOn)
			.utc(true)
			.add(options.expire, 'seconds');
		
		return moment().utc().isAfter(reqDate, 'seconds')
			? false
			: record;
	};

	/**
	 * @public
	 * Removes password reset code
	 * @name UserSecurityTrait.removePasswordResetCode
	 * @see UserSecurityTrait.removePasswordResetToken
	 */
	model.prototype.removePasswordResetCode = function () {
		this.removePasswordResetToken();
		this.setJsonValue('password.resetCode', null);
	};

	/**
	 * @public
	 * @static
	 * @async
	 * Find user by auth key
	 * @name UserSecurityTrait.findByAuthKey
	 * @param {string} key - The Auth key
	 * @param {sequelize.FindOptions|Object} options={} - {key:value} pairs of additional query options
	 * @return {Promise<User|null>} - Promise instance (User model / Not found)
	 */
	model.findByAuthKey = async ( key, options = {} ) => {
		return await model.findOne({
			where: {
				authorization_key: key
			},
			...options,
		});
	};

	/**
	 * @public
	 * @name UserSecurityTrait.getAuthKey
	 * Returns a key that can be used to check the validity of a given identity ID.
	 * @returns {string} - Auth key
	 */
	model.prototype.getAuthKey = function () {
		return this.get('authorization_key');
	};

	/**
	 * @public
	 * @name UserSecurityTrait.validateAuthKey
	 * Validates the given auth key
	 * @param {string} authKey - The given auth key
	 * @returns {boolean} - True when valid / False otherwise
	 */
	model.prototype.validateAuthKey = function ( authKey ) {
		return authKey === this.getAuthKey();
	};

	/**
	 * @public
	 * @name UserSecurityTrait.generateAuthKey
	 * Generates token authentication key
	 */
	model.prototype.generateAuthKey = function () {
		this.set('authorization_key', nanoid(params.authKeyLength));
	};
};
