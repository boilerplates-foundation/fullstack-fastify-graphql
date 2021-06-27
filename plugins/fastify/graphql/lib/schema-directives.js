/**
 * GraphQL custom directives' definition file
 * @author Junaid Atari <mj.atari@gmail.com>
 * @link https://github.com/blacksmoke26 Author Website
 * @since 2021-06-16
 */

const AuthDirective = require(`./../../../../graphql/directives/auth-directive`);
const GuestDirective = require(`./../../../../graphql/directives/guest-directive`);

module.exports = {
	auth: AuthDirective,
	guest: GuestDirective,
};
