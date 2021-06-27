/**
 * Fastify JWT/Identity Utility methods
 * @author Junaid Atari <mj.atari@gmail.com>
 * @link https://github.com/blacksmoke26 Author Website
 * @since 2021-06-17
 */

/** Native/Installed modules */
const moment = require('moment');
const cookie = require('cookie');
const {recursive} = require('merge');
const objectPath = require('object-path');
const {last: R_lastItem, has: R_has} = require('ramda');

/**
 * @public
 * @see ErrorConstructor Error object
 * Create an Auth Error instance
 * @param {string} msg The message
 * @param {string} [code=403] Error code
 * @param {string} [status=Forbidden] Status type
 * @return {Error} Error object
 */
function AuthError ( msg, code = 403, status = 'Forbidden' ) {
	let err = new Error (msg);
	err.statusCode = code || 403;
	err.statusText = status || 'Forbidden';
	return err;
}

/**
 * @public
 * Get token from cookie
 * @param {(fastify#FastifyRequest|FastifyRequest)} request Fastify request instance
 * @return {string|Error} Auth token / Error object
 */
function getTokenFromCookie ( request ) {
	// Retrieve from cookie
	if ( !R_has('cookie', request.headers) ) {
		return AuthError('Authorization required', 401, 'Unauthorized');
	}

	/**
	 * Parsed Cookies
	 * @type {Object.<string, string>}
	 * @property {?string} [auth_token] JWT Auth token
	 */
	const cookies = cookie.parse(request.headers.cookie);

	/**
	 * Auth token
	 * @type {string}
	 */
	let token;

	// Retrieve value
	if ( !R_has('auth_token', cookies) || !(token = String(cookies.auth_token).trim()) ) {
		return AuthError('Token was empty', 400, 'Bad Request');
	}

	return token;
}

/**
 * Get token from authorization header (Bearer)
 * @param {fastify#FastifyRequest} request Fastify request instance
 * @return {string|Error} Auth token / Error object
 */
function getTokenFromAuthBearer ( request ) {
	// Error: Missing authorization header
	if ( !R_has('authorization', request.headers) ) {
		return AuthError('Missing authorization header', 401, 'Unauthorized');
	}

	/**
	 * Authorization header value
	 * @type {string}
	 */
	const header = String(request.headers['authorization']).trim();

	// Error: Empty token
	if ( !header ) {
		return AuthError('Token was empty', 400, 'Bad Request');
	}

	return String(R_lastItem(header.split(' '))).trim();
}

/**
 * Get token from all sources
 * @param {fastify#FastifyRequest} request Fastify request instance
 * @return {string|Error} JWT Auth token / Error object
 */
function getTokenFromAll ( request ) {
	/**
	 * Auth token
	 * @type {string}
	 */
	let token = getTokenFromAuthBearer(request);

	if ( token instanceof Error ) {
		token = getTokenFromCookie(request);
	}

	return token;
}

/**
 * @constructor
 * @module jwt-identity
 * @param {FastifyServer} fastify Fastify instance
 */
module.exports = fastify => {
	const {User} = fastify.db.models;

	/**
	 * MomentJS; ATOM format
	 * @type {string}
	 */
	const DATE_ATOM = 'YYYY-MM-DDTHH:mm:ssZ';

	/**
	 * Format token timestamp into date
	 * @see FastifyJwt.JwtDecoded JwtDecoded
	 * @see moment.Moment.format moment.format
	 * @param {number} timestamp The time stamp
	 * @return {string} formatted date
	 */
	function formatTokenTime ( timestamp ) {
		return moment(new Date(timestamp*1000))
			.utc()
			.format(DATE_ATOM);
	}

	/**
	 * @private
	 * Get token expiration datetime
	 * @see FastifyJwt.JwtDecoded JwtDecoded
	 * @see moment.Moment.format moment.format
	 * @param {string} issuedAt Issue ATOM date
	 * @return {string}
	 */
	function getExpirationDateTime ( issuedAt ) {
		/** @type {number} */
		let days = Number(getConfig('expireAfterDays', 15));

		return moment(issuedAt)
			.utc()
			.add(days, 'days')
			.format(DATE_ATOM);
	}

	/**
	 * @private
	 * @see FastifyJwt.JwtDecoded JwtDecoded
	 * @see moment.Moment.format moment.format
	 * Get token expiration datetime
	 * @param {string} issuedAt Issue ATOM date
	 * @return {string}
	 */
	function getNotBeforeDateTime ( issuedAt ) {
		/** @type {number} */
		let seconds = Number(getConfig('notBeforeSeconds', 0));

		return moment(issuedAt)
			.utc()
			.add(seconds, 'seconds')
			.format(DATE_ATOM);
	}

	/**
	 * @public
	 * Verify and decode JWT token
	 * @see FastifyJwt.JwtDecoded FastifyJwt.JwtDecoded
	 * @param {string} token Token to be decoded
	 * @return {FastifyJwt.JwtDecoded} Decoded token data
	 * @throws {Error} Failed to decode token
	 */
	function decodeToken ( token ) {
		try {
			// to decode token data
			return fastify.jwt.verify(token, {
				algorithms: ['HS512'],
				issuer: fastify.config.get('uri.url'),
				audience: fastify.config.get('uri.baseUrl'),
				jwtid: fastify.config.get('auth.jwt.claims.jti'),
				sub: fastify.config.get('auth.jwt.claims.sub'),
			});
		} catch (err) {
			throw AuthError(err.message, 400, 'Bad Request');
		}
	}

	/**
	 * @async
	 * @public
	 * @see FastifyJwt.sign
	 * Create JWT auth token
	 * @param {string} authKey User auth key
	 * @param {number} role User account type/role
	 * @returns {FastifyJwt~TokenData} Token data
	 * @throws {Error} Failed to create token
	 */
	async function createToken ( authKey, role ) {
		const issuedAt = moment().utc().format(DATE_ATOM),
			notBefore = getNotBeforeDateTime(issuedAt),
			expireOn = getExpirationDateTime(issuedAt);

		/** @type {FastifyJwt#JwtDecoded} */
		let token = await fastify.jwt.sign({
			iss: fastify.config.get('uri.url'),
			aud: fastify.config.get('uri.baseUrl'),
			jti: getConfig('claims.jti'),
			sub: getConfig('claims.sub', 'auth'),
			iat: moment(issuedAt).utc().unix(),
			nbf: moment(notBefore).utc().unix(),
			exp: moment(expireOn).utc().unix(),
			idt: authKey,
			rol: role,
		}, {
			algorithm: 'HS512',
		});

		return {
			auth_token: token,
			issued_at: issuedAt,
			expires_at: expireOn,
		}
	}

	/**
	 * @public
	 * Get jwt configuration
	 * @param {string|string[]} [path=] Deep property path (separated by .)
	 * @param {*} [defaultValue=null] (optional) Default value if none
	 * @return {(string|number|Object|array|*)} the value of the element if found, default value otherwise
	 */
	function getConfig ( path, defaultValue = null ) {
		return objectPath.get (fastify.config.get('session.jwt'), path, defaultValue);
	}

	/**
	 * @typedef {Object} FindIdentityToken
	 * @property {User#} model User identity model
	 * @property {Object|FastifyJwt~TokenData} decoded Decoded token data
	 */

	/**
	 * @private
	 * @async
	 * get user from data loader by auth key
	 * @param {string} authKey - Authorization key
	 * @param {Object} [options={}] (optional) {key:value} pairs of additional options
	 * @param {(Object|sequelize.FindOptions)} [options.query] {key:value} pairs of Sequelize query options
	 * @returns {Promise<User|null>} - The model / Not found
	 */
	const userFromDataLoader = async ( authKey, options ) => {
		options = recursive(true, {
			query: {},
		}, options);

		/**
		 * User data loader
		 * @type {DataLoader}
		 */
		const userLoader = fastify.dataLoaders.authUsers;

		/** @type {User|null} */
		let model;

		try {
			[model] = await userLoader.load(authKey);

			if ( model ) {
				/** @type {boolean} */
				const invalidate = model.getJsonValue('security.token.invalidate');

				if ( invalidate ) {
					model = null;
				}
			}
		} catch ( e ) {
			model = null;
		}

		if ( !model ) {
			model = await User.findByAuthKey(authKey, options.query);
			userLoader.prime(authKey, model);
		}

		return model;
	};

	/**
	 * @public
	 * @async
	 * Find and get user identity from token
	 * <br> Note: required attributes are: id, email, authorization_key, role, status
	 * @param {string} token JWT token
	 * @param {Object} [options={}] (optional) {key:value} pairs of additional options
	 * @param {(Object|sequelize.FindOptions)} [options.query] {key:value} pairs of Sequelize query options
	 * @return {Promise<FindIdentityToken>} - Promise instance
	 * @throws {Error} When failed to authenticate
	 */
	async function findIdentityByToken ( token, options = {} ) {
		/**
		 * Decoded token data
		 * @type {Object}
		 */
		const decoded = decodeToken(token);

		/** @type {string} */
		const authKey = decoded['idt'];

		/** @type {User|null} */
		const model = await userFromDataLoader(authKey, options);

		// Error: No user found
		if ( null === model ) {
			throw AuthError('Token may invalidated or user not found', 404, 'Not found');
		}

		// Error: User account was not active
		if ( !User.validateStatusOnLogin(model.status) ) {
			throw AuthError(`Your account has been ${model.toStatus().toLowerCase()}`, 401, 'Unauthorized');
		}

		// Error: User account was not active
		if ( model.getJsonValue('security.token.invalidate') ) {
			throw AuthError('Access token is expired, disabled, or deleted, or the user has globally signed out', 400, 'Bad Request');
		}
		
		// Error: Ineligible user role
		if ( +decoded['rol'] !== +model.role ) {
			throw AuthError(`Ineligible user role`, 401, 'Unauthorized');
		}

		return { model, decoded };
	}

	return {
		DATE_ATOM,
		findIdentityByToken,
		decodeToken,
		AuthError,
		getTokenFromAll,
		getTokenFromCookie,
		getTokenFromAuthBearer,
		createToken,
		formatTokenTime,
		getConfig,
	}
};

