/**
 * GraphQL @guest directive
 * @author Junaid Atari <mj.atari@gmail.com>
 * @link https://github.com/blacksmoke26 Author Website
 * @since 2021-06-16
 */

const RequestError = require('./../components/RequestError');
const {SchemaDirectiveVisitor} = require('graphql-tools');
const {defaultFieldResolver} = require('graphql');

/**
 * @class GuestDirective
 * This directive will only allow non-auth users (guest) to perform actions
 */
class GuestDirective extends SchemaDirectiveVisitor {
	/**
	 * @inheritDoc
	 */
	visitObject ( type ) {
		this.ensureFieldsWrapped(type);
		GuestDirective.initRequiredParams(type);
	}

	/**
	 * @inheritDoc
	 */
	visitFieldDefinition ( field, details ) {
		this.ensureFieldsWrapped(details.objectType);
		GuestDirective.initRequiredParams(field);
	}

	/**
	 * @inheritDoc
	 */
	visitArgumentDefinition ( argument, details ) {
		this.ensureFieldsWrapped(details.objectType);
		GuestDirective.initRequiredParams(argument);
	}

	/**
	 * @inheritDoc
	 */
	visitInputObject ( object ) {
		this.ensureFieldsWrapped(object);
		GuestDirective.initRequiredParams(object);
	}
	/**
	 * @inheritDoc
	 */
	visitInputFieldDefinition ( field, details ) {
		this.ensureFieldsWrapped(details.objectType);
		GuestDirective.initRequiredParams(field);
	}

	/**
	 * @protected
	 * Wrap fields and validate permissions
	 * @param {(GraphQLObjectType|GraphQLInterfaceType)} objectType - The container object
	 * @throws {RequestError} - This can only access by non-authenticated users
	 */
	ensureFieldsWrapped ( objectType ) {
		//<editor-fold desc="Mark the GraphQLObjectType object to avoid re-wrapping">
		if ( objectType._guestFieldsWrapped ) {
			return;
		}

		objectType._guestFieldsWrapped = true;
		//</editor-fold>

		/** @type {GraphQLField[]} */
		const fields = objectType.getFields();

		Object.keys(fields).forEach(/** @type {string}*/ name => {
			const field = fields[name];
			const { resolve = defaultFieldResolver } = field;

			field.resolve = async function ( ...args ) {
				const [, details = {}, context] = args;
				const fieldArgs = [...field.args];

				if ( fieldArgs.length ) {
					GuestDirective.validateArguments(fieldArgs, context, details)
				}

				if ( field.hasOwnProperty('_guestOnly')
					|| objectType.hasOwnProperty('_guestOnly') ) {
					await GuestDirective.checkPermission(context);
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
	 * @param {Query~GraphQLContext} ctx - contain per-request state, including authentication information and anything else
	 * @param {Object} details - Provided arguments
	 * @throws {RequestError} When any error occurred
	 */
	static validateArguments ( args, ctx, details = {} ) {
		const {app, reply} = ctx;
		const {request} = reply;

		args.forEach(arg => {
			if ( (arg.hasOwnProperty('_guestOnly') && details.hasOwnProperty(arg.name))
				&& !app.user.isGuest ) {
				let msg = request.t('Argument `%s` can only access by non-authenticated user(s).', arg.name);
				throw new RequestError(msg, 'NOT_ALLOWED');
			}
		});
	}

	/**
	 * @protected
	 * Add internal properties to the given container object
	 * @param {(GraphQLField|GraphQLObjectType)} object - The container object
	 */
	static initRequiredParams ( object ) {
		object._guestOnly = true;
	}

	/**
	 * @protected
	 * @static
	 * Check query/field permission(s) and validate guest user
	 * @param {Query~GraphQLContext} context - contain per-request state, including authentication information and anything else
	 * @throws {RequestError} - This can only access by non-authenticated users
	 * @example
	 * // Will throw error
	 * GuestDirective.checkPermission(context);
	 */
	static async checkPermission ( context ) {
		const {app, request} = context;
		const {user} = app;
		
		if ( !user.isGuest ) {
			throw new RequestError(request.t('This can only access by non-authenticated users'), 'NOT_ALLOWED');
		}
	}
}

module.exports = GuestDirective;
