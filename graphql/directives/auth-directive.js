/**
 * GraphQL @auth directive
 * @author Junaid Atari <mj.atari@gmail.com>
 * @link https://github.com/blacksmoke26 Author Website
 * @since 2021-06-16
 */

const op = require('object-path');
const {defaultFieldResolver} = require('graphql');
const {SchemaDirectiveVisitor} = require('graphql-tools');

const RequestError = require('./../components/RequestError');

/** @type {Object} */
const rolesMap = {
	3: 'CUSTOMER',
};

/** @type {Object} */
const statusesMap = {
	1: 'ACTIVE',
	2: 'INACTIVE',
	0: 'DELETED',
	3: 'BLOCKED',
	4: 'DISABLED',
};

/**
 * @class AuthDirective
 * This directive will only allow auth user to perform actions
 */
class AuthDirective extends SchemaDirectiveVisitor {
	/**
	 * @inheritDoc
	 */
	visitObject ( type ) {
		this.ensureFieldsWrapped(type);
		this.initRequiredParams(type);
	}
	
	/**
	 * @inheritDoc
	 */
	visitFieldDefinition ( field, details ) {
		this.ensureFieldsWrapped(details.objectType);
		this.initRequiredParams(field);
	}
	
	/**
	 * @inheritDoc
	 */
	visitArgumentDefinition ( argument, details ) {
		this.ensureFieldsWrapped(details.objectType);
		this.initRequiredParams(argument);
	}
	
	/**
	 * @inheritDoc
	 */
	visitInputObject ( object ) {
		this.ensureFieldsWrapped(object);
		this.initRequiredParams(object);
	}
	
	/**
	 * @inheritDoc
	 */
	visitInputFieldDefinition ( field, details ) {
		this.ensureFieldsWrapped(details.objectType);
		this.initRequiredParams(field);
	}
	
	/**
	 * @protected
	 * Add internal properties to the given container object
	 * @param {(GraphQLField|GraphQLObjectType)} object - The container object
	 */
	initRequiredParams ( object ) {
		object._authData = {
			role: this.args.role || [],
			status: this.args.status || [],
			id: this.args.id || [],
		};
	}
	
	/**
	 * @protected
	 * @static
	 * Get property's value from directive internal object
	 * @param {(GraphQLField|GraphQLObjectType)} obj - The container object
	 * @param {string} name - property's name
	 * @return {(Array|boolean)} - The data / Not found
	 */
	static getAuthProp ( obj, name ) {
		return obj.hasOwnProperty('_authData')
			? obj._authData[name]
			: false;
	}
	
	/**
	 * @protected
	 * Wrap fields and validate permissions
	 * @param {(GraphQLObjectType|GraphQLInterfaceType)} objectType - The container object
	 */
	ensureFieldsWrapped ( objectType ) {
		//<editor-fold desc="Mark the GraphQLObjectType object to avoid re-wrapping">
		if ( objectType._authFieldsWrapped ) {
			return;
		}
		
		objectType._authFieldsWrapped = true;
		//</editor-fold>
		
		/** @type {GraphQLField[]} */
		const fields = objectType.getFields();
		
		Object.keys(fields).forEach(/** @type {string}*/ name => {
			const field = fields[name];
			const {resolve = defaultFieldResolver} = field;
			
			field.resolve = async function ( ...args ) {
				/** [source, argument, context, info] */
				const [, details = {}, context] = args;
				const fieldArgs = [...field.args];
				
				if ( fieldArgs.length ) {
					AuthDirective.validateArguments(fieldArgs, context, details);
				}
				
				if ( objectType.hasOwnProperty('_authData')
					|| field.hasOwnProperty('_authData') ) {
					
					/** @type {object[]} */
					const funcArg = {
						role: AuthDirective.getAuthProp(field, 'role')
							|| AuthDirective.getAuthProp(objectType, 'role')
							|| [],
						status: AuthDirective.getAuthProp(field, 'status')
							|| AuthDirective.getAuthProp(objectType, 'status')
							|| [],
						id: AuthDirective.getAuthProp(field, 'id')
							|| AuthDirective.getAuthProp(objectType, 'id')
							|| [],
					};
					
					AuthDirective.checkPermission(context, funcArg);
				}
				
				return resolve.apply(this, args);
			};
		});
	}
	
	/**
	 * @protected
	 * @static
	 * Validate field's arguments permissions
	 * @param {GraphQLArgument[]} args - Field arguments
	 * @param {Query~GraphQLContext} context - contain per-request state, including authentication information and anything else
	 * @param {Object} details - Provided arguments
	 * @throws {RequestError} When any error occurred
	 */
	static validateArguments ( args, context, details = {} ) {
		args.forEach(arg => {
			if ( arg.hasOwnProperty('_authData') && details.hasOwnProperty(arg.name) ) {
				AuthDirective.checkPermission(context, {
					role: AuthDirective.getAuthProp(arg, 'role') || [],
					status: AuthDirective.getAuthProp(arg, 'status') || [],
					id: AuthDirective.getAuthProp(arg, 'id') || [],
				});
			}
		});
	}
	
	/**
	 * @protected
	 * @static
	 * Check query/field permission(s) and validate based on current auth user
	 * @param {Query~GraphQLContext} context - contain per-request state, including authentication information and anything else
	 * @param {Array<number>} id - Allowed user primary key IDs
	 * @param {Array<'OWNER'|'AGENT'|'DEVELOPER'>} role - Allowed roles
	 * @param {Array<'ACTIVE'|'INACTIVE'|'DELETED'|'BLOCKED'|'DISABLED'>} status - Allowed statuses
	 * @throws {RequestError} - Access Forbidden
	 * @throws {RequestError} - Bad user role
	 * @throws {RequestError} - Bad account status
	 * @throws {RequestError} - Only specific users are allowed
	 * @example
	 * // Will throw error
	 * AuthDirective.checkPermission(context, {role, status, id});
	 */
	static checkPermission ( context, {role = [], status = [], id = []} ) {
		const request = op.get(context, 'request', {
			t: v => v,
		});
		const user = op.get(context, 'app.user', {
			isGuest: true,
		});
		
		// Guest user / not allowed
		if ( user.isGuest ) {
			throw new RequestError(request.t('Not Authorized'), 'UNAUTHORIZED');
		}
		
		//<editor-fold desc="Check Role(s)">
		if ( role.length ) {
			let userRole = rolesMap[user.identity.role];
			if ( !role.includes(userRole) ) {
				throw new RequestError(request.t('Bad user role'), 'BAD_ROLE');
			}
		}
		//</editor-fold>
		
		//<editor-fold desc="Check Status(es)">
		if ( status.length ) {
			let userStatus = statusesMap[user.identity.status];
			if ( !status.includes(userStatus) ) {
				throw new RequestError(request.t('Bad account status'), 'BAD_STATUS');
			}
		}
		//</editor-fold>
		
		//<editor-fold desc="Check ID(s)">
		if ( id.length && !id.includes(user.id) ) {
			throw new RequestError(request.t('Only specific users are allowed'), 'NOT_ALLOWED');
		}
		//</editor-fold>
	}
}

module.exports = AuthDirective;
