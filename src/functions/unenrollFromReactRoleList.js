module.exports = async(message) => {
  const mainProgram = require("../../index.js");
  const client = mainProgram.client;
  const updateReactRolesWhileOffline = require('./updateReactRolesWhileOffline.js');

	if (message.embeds[0].author.name == client.newNotificationListAuthorName) {
		//let reaction = message.reactions.cache.get(`❌`);
		let reaction = message.reactions.cache.array();
		for (let i = 0; i < reaction.length; i++) {
			if (reaction[i].emoji.name === '❌') {
				let reactions = await reaction[i].users.fetch();
				if (reactions) {
					await reactions.each(async user => {
						if (user.id != client.user.id) {
							await message.guild.members.fetch(user.id)
								.then(async member => {
									//get all roles and remove them also remove emoji clicks.
									let userRoles = await member.roles.cache;
									for (const rolesToRemove of client.searchTvShowsNotificationSettings.iterate()) {
										if (message.guild.id == rolesToRemove.guild) {
											if (rolesToRemove.roleID != null && rolesToRemove.roleID != undefined && rolesToRemove.roleID != "") {
												let individualRole = await userRoles.get(rolesToRemove.roleID);
												if (individualRole) {
													//remove the role
				                  await member.roles.remove(rolesToRemove.roleID)
				                    .catch(console.error);
												}
											}
										}
									}

									for (const rolesToRemove of client.searchNotificationSettings.iterate()) {
										if (message.guild.id == rolesToRemove.guild) {
											if (rolesToRemove.roleID != null && rolesToRemove.roleID != undefined && rolesToRemove.roleID != "") {
												let individualRole = await userRoles.get(rolesToRemove.roleID);
												if (individualRole) {
													//remove the role
				                  await member.roles.remove(rolesToRemove.roleID)
				                    .catch(console.error);
												}
											}
										}
									}

									let inactiveUser = client.getNewListInactiveUsers.get(`${message.guild.id}-${user.id}`);
									if (inactiveUser === undefined || inactiveUser === "" || inactiveUser === null) {
										// user not in database so create entry
										inactiveUser = { id: `${message.guild.id}-${user.id}`, guild: `${message.guild.id}`, discordUserID: `${user.id}`, inactive: `true`, wipeRoleReactions: `true` };
										client.setNewListInactiveUsers.run(inactiveUser);
										inactiveUser = await client.getNewListInactiveUsers.get(`${message.guild.id}-${user.id}`);
									}

									inactiveUser.inactive = "true";
									inactiveUser.wipeRoleReactions = "true";
									client.setNewListInactiveUsers.run(inactiveUser);

									// remove all react role clicks and resume.
									await reaction[i].users.remove(user); // remove emoji click by user, this is also important to not have an endless loop.
								});
						}
					});
				}
			}
		}
		await updateReactRolesWhileOffline(false, true, false);
	}
}
