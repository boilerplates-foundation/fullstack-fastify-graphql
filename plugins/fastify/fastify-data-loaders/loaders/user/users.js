/**
 * User Data Loaders
 * @author Junaid Atari <mj.atari@gmail.com>
 * @link https://github.com/blacksmoke26 Author Website
 * @since 2021-06-17
 */

const DataLoader = require('dataloader');

/**
 * Initializes sequelize models and their relations.
 * @param {FastifyServer} fastify - Fastify instance
 * @param {object} loaders - Loaders container.
 * @returns {SequelizeModels} - Sequelize models.
 */
module.exports = ( fastify, loaders ) => {
	const {User} = fastify.db.models;

	/**
	 * User data Loaders
	 * @mixin UsersDataLoader
	 */

	/**
	 * Owner user data Loader (Key: ID)
	 * @name UsersDataLoader.ownerUsers
	 * @type {DataLoader}
	 */
	loaders.ownerUsers = new DataLoader(async ids => {
		const rows = await User.findAll({
			where: {
				id: ids,
				status: User.STATUS_ACTIVE,
			},
			raw: true,
		});
		
		return ids.map(id => rows.filter(x => Number(x.id) === Number(id)));
	});
	
	/**
	 * Auth Users data Loader (Key: auth_key)
	 * <br><b>Note:</b> This doesn't load anything, you have to fetch record manually then store via prime() method.
	 * @name UsersDataLoader.authUsers
	 * @type {DataLoader}
	 */
	loaders.authUsers = new DataLoader(async keys => {
		return {};
	});
};
