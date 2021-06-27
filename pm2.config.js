/**
 * PM2 setup configuration file
 * @author Junaid Atari <mj.atari@gmail.com>
 * @link https://github.com/blacksmoke26 Author Website
 * @since 2021-06-27
 */

/** Native/Installed modules */
require('dotenv').config();

/** Custom modules */
const {isDev} = require('./utils/environment');

// Export to module
module.exports = {
	/**
	 * Application configuration section
	 * http://pm2.keymetrics.io/docs/usage/application-declaration/
	 */
	apps: [{
		// Main application
		name: '3itstem/apis',
		script: 'server.js',

		// Watch list
		watch: [
			"controllers/**/*",
			"fastify/**/*",
			"graphql/**/*",
			"helpers/**/*",
			"locales/src/*",
			"mail/*",
			"modules/**/*",
			"plugins/**/*",
			"sequelize/**/*",
			"utils/**/*",
		],
		watch_options: {
			followSymlinks: false,
		},

		// Mode
		exec_mode: 'cluster',
		instances: isDev ? 2 : 4,
		max_restarts: 11,

		// Logs
		error_file: `${__dirname}/runtime/pm2/error/error.log`,
		out_file: `${__dirname}/runtime/pm2/out/out.log`,
		merge_logs: true,
  		log_date_format: 'YYYY-MM-DD HH:mm Z',
		ignore_watch : ['node_modules/**/*', 'runtime/**/*', 'tests/**/*'],
	}],
};
