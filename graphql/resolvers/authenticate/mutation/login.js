/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @link https://github.com/blacksmoke26 Author Website
 * @since 2021-06-17
 */

const moment = require('moment');

/** Utils */
const UserAuth = require('../../../../helpers/fastify/auth/authenticate');
const JWTIdentity = require('../../../../helpers/fastify/auth/jwt-identity');
const RequestError = require('./../../../components/RequestError');

/**
 * @param {ResolversDefs} defs - Resolvers definitions
 * @param {FastifyInstance&FastifyServer} fastify - Fastify instance
 * @return {Promise<void>} - Promise instance
 */
module.exports = async ( {Mutation}, fastify ) => {
	const {User} = fastify.db.models;
	const {authUsers} = fastify.dataLoaders;
	
	const {setAuthCookie} = UserAuth(fastify);
	const {createToken} = JWTIdentity(fastify);
	
	/**
	 * Find and validate user identity
	 * @param {Object} input - Input data
	 * @param {Query~GraphQLContext} ctx - Fastify reply instance
	 * @returns {Promise<User>} - Promise instance
	 * @throws {RequestError} - On validation failed
	 */
	const findIdentity = async ( input, {request} ) => {
		const {email, password} = {...input};
		
		/** @type {User#} */
		const model = await User.findByEmail(email);
		
		//<editor-fold desc="Error: Unknown email address.">
		if ( model === null ) {
			/** @type {string} */
			const msg = request.t('Unknown email address.');
			throw new RequestError(msg, 'UNKNOWN_EMAIL', {email: msg});
		}
		//</editor-fold>
		
		/** @type {number} */
		const accountStatus = model.get('status');
		
		//<editor-fold desc="Error: Not a valid status">
		if ( accountStatus === User.STATUS_INACTIVE ) {
			const status = model.toStatus();
			
			/** @type {string} */
			const message = request.t('Your account has pending activation.', {
				status: request.t(status)
			});
			
			throw new RequestError(message, `PENDING_ACTIVATION`, {email: message});
		}
		//</editor-fold>
		
		//<editor-fold desc="Error: Not a valid status">
		if ( !User.validateStatusOnLogin(model.get('status')) ) {
			const status = model.toStatus();
			
			/** @type {string} */
			const message = request.t('Your account has been {{status}}.', {
				status: request.t(status)
			});
			
			throw new RequestError(message, `ACCESS_REVOKED`, {email: message});
		}
		//</editor-fold>
		
		//<editor-fold desc="Error: Invalid password">
		if ( !model.validatePassword(password) ) {
			/** @type {string} */
			const message = request.t('Incorrect email address or password.');
			
			model.updateJsonCounter('login.history.failed.counts');
			await model.save();
			
			throw new RequestError(message, 'INVALID_PASSWORD', {password: message});
		}
		//</editor-fold>
		
		//<editor-fold desc="Error: Pending activation">
		if ( model.getJsonValue('activation.pending', false) ) {
			/** @type {string} */
			const message = request.t('Your account is not activated.');
			throw new RequestError(message, 'NOT_ACTIVATED', {email: message});
		}
		//</editor-fold>
		
		return model;
	};
	
	/**
	 * Get request IP address
	 * @return {string}
	 */
	const getRequestIP = request => {
		return request.ip
			|| request.headers['x-forwarded-for']
			|| request.raw.connection.remoteAddress
			|| '';
	};
	
	/**
	 * @public
	 * @async
	 * (Mutation) Login user
	 * @param {Object} root - The object that contains the result returned from the resolver on the parent field
	 * @param {Object} args - The arguments passed into the field in the query
	 * @param {Mutation~GraphQLContext} ctx - Fastify reply instance
	 * @returns {Promise<(Error|boolean)>}
	 * @see Uses `@guest` directive
	 */
	Mutation.login = async ( root, {cookie, input}, ctx ) => {
		const {request, reply} = ctx;
		
		/** @type {User#} */
		const model = await findIdentity(input, ctx);
		
		//<editor-fold desc="Update auth details">
		model.setJsonValue('login.history', {
			lastIp: getRequestIP(request),
			lastDate: moment().utc().format('YYYY-MM-DD HH:mm:ss'),
			failed: {counts: 0}
		});
		
		model.setJsonValue('security.token.invalidate', false);
		model.updateJsonCounter('login.history.successful.counts');
		
		await model.save();
		//</editor-fold>
		
		/** @type {string} */
		const authKey = model.getAuthKey();
		
		/**
		 * Token data
		 * @type {Object} */
		const data = await createToken(authKey, model.get('role'));
		
		// Clear user from dataloader
		authUsers.clear(authKey).prime(authKey, model);
		
		if ( cookie ) {
			// Set auth cookie
			setAuthCookie({data: {data}}, request, reply);
		}
		
		return {
			me: await User.toGraphMeObject(model, request.language),
			token: {
				token: data.auth_token,
				expiresAt: data.expires_at,
				issuedAt: data.issued_at,
			}
		};
	};
};
