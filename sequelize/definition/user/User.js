/**
 * User model
 * @author Junaid Atari <mj.atari@gmail.com>
 * @link https://github.com/blacksmoke26 Author Website
 * @since 2021-06-17
 */

const moment = require('moment');
const Sequelize = require('sequelize');
const {recursive} = require('merge');
const {invertObj: R_invertObj} = require('ramda');

// Utils
const Traits = require('./../../utils/traits-helper');
const Op = Sequelize.Op;

/**
 * This is the model class for table "public.users".
 * @param {sequelize~Sequelize} sequelize - Sequelize instance
 * @param {sequelize~DataTypes} DataTypes - Sequelize data types
 * @param {FastifyServer} fastify - Fastify instance
 */
module.exports = ( sequelize, DataTypes, fastify ) => {
	/**
	 * The `meta` attribute has the following properties
	 * @typedef {Object} UserMetaData
	 * @property {string} language - Language ISO code (xx-XX)
	 * @property {string} timezone - Timezone
	 *
	 * @property {Object} security - Security options
	 * @property {boolean} security.token.invalidate - Invalidated token
	 *
	 * @property {Object} activation - Activation options
	 * @property {boolean} activation.pending - Pending
	 * @property {?string} activation.requestedOn - Requested date (YYYY-MM-DD HH:mm:ss)
	 * @property {?string} activation.completedOn - Completed date (YYYY-MM-DD HH:mm:ss)
	 *
	 * @property {Object} password - Password options
	 * @property {Object} password.reset - Password reset options
	 * @property {Object} password.reset.lastResetOn - Last reset date (YYYY-MM-DD HH:mm:ss)
	 * @property {number} password.reset.counts - Reset counts
	 * @property {Object} password.changed - Password changed options
	 * @property {?string} password.changed.lastChangedOn - Last changed date (YYYY-MM-DD HH:mm:ss)
	 * @property {number} password.changed.counts - Changed counts
	 *
	 * @property {Object} login - Login options
	 * @property {Object} login.history Login - history options
	 * @property {?string} login.history.lastIp - Last login IP
	 * @property {?string} login.history.lastDate - Last login Date (YYYY-MM-DD HH:mm:ss)
	 *
	 * @property {Object} login.history.successful - Successful login options
	 * @property {number} login.history.successful.counts - Successful login's count
	 * @property {Object} login.history.failed - Failed login options
	 * @property {number} login.history.failed.counts - Failed login's count
	 */
	
	/**
	 * @class User
	 * User model
	 * @mixes sequelize#Instance
	 * @mixes GeneralMethodsTrait
	 * @mixes JsonbTrait
	 * @mixes TypeTrait
	 * @mixes StatusTrait
	 * @mixes UserSecurityTrait
	 * @mixes CursorPaginationTrait
	 * @mixes NumberPaginationTrait
	 */
	const User = sequelize.define('User', {
		/**
		 * ID
		 * @memberOf User#
		 * @type {*} */
		id: {
			type: DataTypes.INTEGER,
			field: 'id',
			allowNull: false,
			primaryKey: true,
			autoIncrement: true,
			comment: 'ID',
		},
		
		/**
		 * Email Address
		 * @memberOf User#
		 * @type {str} */
		email: {
			type: DataTypes.STRING(255),
			field: 'email',
			allowNull: false,
			comment: 'Email Address',
			validate: {
				isEmail: true,
			},
			set: function ( val ) {
				this.setDataValue('email', val.toLowerCase());
			},
		},
		
		/**
		 * Full Name
		 * @memberOf User#
		 * @type {str} */
		name: {
			type: DataTypes.STRING(40),
			field: 'name',
			allowNull: false,
			comment: 'Name'
		},
		
		/**
		 * User Role
		 * @memberOf User#
		 * @type {number} */
		role: {
			type: DataTypes.INTEGER,
			field: 'role',
			allowNull: true,
			defaultValue: 1,
			comment: 'User Role'
		},
		
		/**
		 * Password
		 * @memberOf User#
		 * @type {string} */
		password: {
			type: DataTypes.STRING(50),
			field: 'password',
			allowNull: false,
			comment: 'Password'
		},
		
		/**
		 * Password Hash
		 * @memberOf User#
		 * @type {string} */
		password_hash: {
			type: DataTypes.STRING(255),
			field: 'password_hash',
			allowNull: true,
			comment: 'Password Hash'
		},
		
		/**
		 * Password Reset Token
		 * @memberOf User#
		 * @type {string} */
		password_reset_token: {
			type: DataTypes.STRING(255),
			field: 'password_reset_token',
			allowNull: true,
			comment: 'Password Reset Token'
		},
		
		/**
		 * Authorization Key
		 * @memberOf User#
		 * @type {string} */
		authorization_key: {
			type: DataTypes.STRING(255),
			field: 'authorization_key',
			allowNull: false,
			comment: 'Authorization Key'
		},
		
		/**
		 * Status
		 * @memberOf User#
		 * @type {number} */
		status: {
			type: DataTypes.INTEGER,
			field: 'status',
			allowNull: true,
			defaultValue: 10,
			comment: 'Status'
		},
		
		/**
		 * Metadata
		 * @memberOf User#
		 * @type {Object} */
		meta: {
			type: DataTypes.JSONB,
			field: 'meta',
			allowNull: true,
			defaultValue: '{}',
			comment: 'Metadata'
		},
		
		/**
		 * Created At
		 * @memberOf User#
		 * @type {string} */
		created_at: {
			type: DataTypes.DATE,
			field: 'created_at',
			allowNull: true,
			comment: 'Created At'
		}
	}, {
		schema: 'user',
		tableName: 'users',
		timestamps: true,
		createdAt: 'created_at',
		updatedAt: false,
	});
	
	//<editor-fold desc="status constants">
	/**
	 * @readonly
	 * @const {number}
	 * @default 10
	 */
	User.STATUS_ACTIVE = 10;
	
	/**
	 * @readonly
	 * @const {number}
	 * @default 2
	 */
	User.STATUS_INACTIVE = 2;
	
	/**
	 * @readonly
	 * @const {number}
	 * @default 0
	 */
	User.STATUS_DELETED = 0;
	
	/**
	 * @readonly
	 * @const {number}
	 * @default 3
	 */
	User.STATUS_BLOCKED = 3;
	
	/**
	 * @readonly
	 * @const {number}
	 * @default 4
	 */
	User.STATUS_DISABLED = 4;
	//</editor-fold>
	
	//<editor-fold desc="Role/Type constants">
	/**
	 * @readonly
	 * @const {number}
	 * @default 3
	 */
	User.TYPE_CUSTOMER = 3;
	
	/**
	 * @readonly
	 * @const {number}
	 * @default 'CUSTOMER'
	 */
	User.ROLE_CUSTOMER = 'CUSTOMER';
	//</editor-fold>
	
	//<editor-fold desc="Bind traits to ORM">
	Traits.bind(User, [
		Traits.TRAIT_JSON_ATTRIBUTE,
		Traits.TRAIT_ORM_ATTRIBUTES,
		Traits.TRAIT_PAGINATION_CURSOR,
		Traits.TRAIT_PAGINATION_NUMBER,
		Traits.TRAIT_STATUS_ATTRIBUTE,
		Traits.TRAIT_TYPE_ATTRIBUTE,
		Traits.TRAIT_USER_SECURITY,
	]);
	//</editor-fold>
	
	/**
	 * @public
	 * Loads default values while initializing model
	 */
	User.prototype.loadDefaults = function () {
		this.set('status', User.STATUS_INACTIVE);
		this.set('role', User.TYPE_CUSTOMER);
		this.set('meta', {
			language: 'en-US',
			timezone: 'UTC',
			security: {
				token: {
					invalidate: false,
				},
			},
			activation: {
				pending: true,
				requestedOn: null,
				completedOn: null,
			},
			password: {
				reset: {
					lastResetOn: null,
					counts: 0,
				},
				changed: {
					lastChangedOn: null,
					counts: 0,
				},
			},
			login: {
				history: {
					lastIp: null,
					lastDate: null,
					successful: {
						counts: 0,
					},
					failed: {
						counts: 0,
					},
				},
			},
		});
	};
	
	/**
	 * @public
	 * Returns an ID that can uniquely identify a user identity.
	 * @returns {number|null}
	 */
	User.prototype.getId = function () {
		const [id] = [...User.primaryKeyAttributes].splice(0, 1);
		
		/** @type {number} */
		const PK = +this.get(id);
		
		return !PK || isNaN(PK) ? null : PK;
	};
	
	/**
	 * @public
	 * Get user role by account type
	 * @returns {string} The role
	 */
	User.prototype.toUserRole = function () {
		return User.getRoles(true)[+this.get('role')];
	};
	
	/**
	 * @public
	 * @async
	 * @static
	 * Find user by email address
	 * @param {string} email - Email address
	 * @param {sequelize~FindOptions} findOptions={} - Sequelize find options
	 * @returns {Promise<User|null>} - Promise instance (User model / Not found)
	 */
	User.findByEmail = async ( email, findOptions = {} ) => {
		return await User.findOne(recursive(true, {
			where: {
				email: email,
			},
		}, findOptions));
	};
	
	/**
	 * @public
	 * @async
	 * @static
	 * Find user by primary key
	 * @param {number} id The ID
	 * @param {sequelize~FindOptions} findOptions={} - Sequelize find options
	 * @returns {Promise<User|number>} - Promise instance (User model / Not found)
	 */
	User.findIdentity = async ( id, findOptions = {} ) => {
		return await User.findOne(recursive(true, {
			where: {
				id: +id || 0,
			},
		}, findOptions));
	};
	
	/**
	 * @public
	 * @static
	 * Validate account status while signing in
	 * @param {int} status - The status ID
	 * @return {boolean} - True when accessible / False otherwise
	 */
	User.validateStatusOnLogin = function ( status ) {
		return +User.STATUS_ACTIVE === +status;
	};
	
	/**
	 * @public
	 * @static
	 * Get user roles
	 * @param {boolean} flip=false - Flip Type values with role keys
	 * @returns {{string: number}|{number: string}} - User roles {role:type|type:role}
	 */
	User.getRoles = ( flip = false ) => {
		const roles = {
			[User.ROLE_CUSTOMER]: User.TYPE_CUSTOMER,
		};
		
		return flip
			? R_invertObj(roles)
			: roles;
	};
	
	/**
	 * @public
	 * @static
	 * Get user role by account type
	 * @param {number} type - Account type
	 * @returns {?number} - User role / Not found
	 */
	User.typeToRole = ( type ) => {
		const roles = {
			[User.TYPE_CUSTOMER]: User.ROLE_CUSTOMER,
		};
		
		return roles.hasOwnProperty(type)
			? roles[type]
			: null;
	};
	
	/**
	 * @public
	 * @static
	 * Get account type from user role
	 * @param {string} role - User role (use User.ROLE_*)
	 * @returns {number|null} - Account Type / Not found
	 */
	User.roleToAccountType = ( role ) => {
		const types = {
			[User.ROLE_CUSTOMER]: User.TYPE_CUSTOMER,
		};
		
		return types.hasOwnProperty(role)
			? types[role]
			: null;
	};
	
	/**
	 * @public
	 * Check that current user has given role or not
	 * @param {string} role - User type to check (e.g., User.ROLE_*)
	 * @returns {boolean} - True when ok / false otherwise
	 */
	User.prototype.isRole = function ( role ) {
		/** @type {string} */
		const currentRole = User.typeToRole(+this.get('role'));
		
		return currentRole === role;
	};
	
	/**
	 * @public
	 * @static
	 * Transform raw record into graphql object
	 * @param {Object|User} record - Record to transform
	 * @param {string} language=null - The Locale ISO to localize data (e.g., ur-PK)
	 * @return {Object} - Transformed object
	 */
	User.toGraphObject = ( record, language = null ) => {
		return {
			id: record.id,
			// TODO: Add fields
		};
	};
	
	/**
	 * @public
	 * @static
	 * @async
	 * Transform raw record into graphql owner object (filters basic user info)
	 * @param {User} model - User model to transform
	 * @param {string} language=null - The Locale ISO to localize data (e.g., ur-PK)
	 * @return {Promise<Object>} - Promise instance - Transformed object
	 */
	User.toGraphMeObject = async ( model, language = null ) => {
		const [firstName, lastName] = model.name.split(' ');
		
		const meta = {
			login: model.getJsonValue('login'),
			language: model.getJsonValue('language'),
			phone: {
				number: model.getJsonValue('phone.number'),
				verified: model.getJsonValue('phone.isVerified'),
				verifiedOn: model.getJsonValue('phone.verifiedOn'),
				requestedOn: model.getJsonValue('phone.requestedOn'),
			},
			password: {
				reset: model.getJsonValue('password.reset'),
				changed: model.getJsonValue('password.changed'),
			},
			timezone: model.getJsonValue('timezone'),
			activation: {
				pending: model.getJsonValue('activation.pending'),
				completedOn: model.getJsonValue('activation.completedOn'),
				requestedOn: model.getJsonValue('activation.requestedOn'),
			},
		};
		
		return {
			id: +model.id,
			firstName,
			lastName,
			email: model.email,
			accountType: {
				value: model.role,
				title: model.toType(),
				type: model.toUserRole(),
			},
			language: model.getJsonValue('language'),
			timezone: model.getJsonValue('timezone'),
			created: moment(model.created_at).utc(true).toISOString(),
			status: {
				value: model.status,
				title: model.toStatus(),
			},
			meta,
		};
	};
	
	/**
	 * @public
	 * @static
	 * Filter the User id and return proper ID.
	 * @param {number} [userId] - (optional) integer User ID | null Use current logged in User ID
	 * @param {boolean} allowGuest=true - False will throw exception when no logged in user.
	 * @returns {number|null} - User ID / Not found
	 * @throws {Error} - When guest user is not allowed.
	 */
	User.getProperId = ( userId = null, allowGuest = true ) => {
		if ( fastify.user.isGuest && userId === null ) {
			if ( allowGuest ) {
				return null;
			}
			
			throw new Error('Guest user is not allowed');
		}
		
		return !userId
			? fastify.user.id
			: userId;
	};
	
	/**
	 * Find active user
	 * @param {sequelize~FindOptions} findOptions={} - Find options
	 * @returns {Promise<Object|User|null>} - Promise instance
	 */
	User.findOneActive = async ( findOptions = {} ) => {
		findOptions.where = {
			status: User.STATUS_ACTIVE,
			'meta.activation.pending': {
				[Op.eq]: false
			},
			...findOptions.where,
		};
		
		return User.findOne(findOptions);
	};
	
	return User;
};

/**
 * Initialize relations
 */
module.exports.initRelations = () => {
	delete module.exports.initRelations; // Destroy itself to prevent repeated calls.
};
