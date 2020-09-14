module.exports = {
	name: 'delete',
	description: 'Delete All Tracked Roles',
	usage: '',
	adminCommand: true,
	async execute(message, args, prefix, guildSettings, client, Discord, config, fetch, exemptEmbedReactRoles, tautulli, sonarr) {
		if (message.channel.guild.member(message.author).hasPermission('ADMINISTRATOR')) {
			var emojiOptions = ['👍', '👎'];
			const filter = (reaction, user) => emojiOptions.indexOf(reaction.emoji.name) != -1;

			exemptEmbedReactRoles.push(`Delete All Tracked Roles`);
			embed = new Discord.MessageEmbed()
				.setAuthor('Delete All Tracked Roles') //don't foget to edit exemptEmbedReactRoles above if name changes so it is ignored in index.js role react
				.setDescription("⚠ **Warning** ⚠\nThis will delete all Discord Roles created by this bot, this is typically only something you want to do if removing this bot from the server. Click 👍 to confirm deletion.")
				.setTimestamp(new Date())
				.setColor(0x00AE86);

			let sentMessage = await message.channel.send({embed});
			sentMessage.react(emojiOptions[0])
				.then(async () => {
					sentMessage.awaitReactions(filter, { time: 15000 })
						.then(async collected => {
							var selectedEmojis = [];
							collected.each(selectedOptions => {
								if (selectedOptions.users.cache.get(message.author.id) != undefined) {
									selectedEmojis.push(selectedOptions._emoji.name);
								}
							});

							var setDescription = "";
							embed = new Discord.MessageEmbed()
								.setTimestamp(new Date())
								.setColor(0x00AE86);

							var count = 0;
							var bypass = false;
							for(let emojis of selectedEmojis) {
								if (emojis == '👎') {
									setDescription = "Cancelled, nothing deleted!";
									bypass = true;
								}
							}
							for(let emojis of selectedEmojis) {
								if (emojis == '👍' && !bypass) {
									setDescription = "Successfully removed all Roles created by this bot!\n\n(*Don't forget if you used a watching role or any custom roles that I do not manage those and did not delete them!*)";
									//Iterate through database and delete all Roles

									var deleteList = [];
									var deleteNotificationList = [];
									var deleteCustomList = [];

									for (const showNotification of client.searchTvShowsNotificationSettings.iterate()) {
				            if (showNotification.guild == message.guild.id && showNotification.roleID != null && showNotification.roleID != undefined && showNotification.roleID != "") {
											if (await message.guild.roles.cache.find(role => role.id === showNotification.roleID) != null) {
												await message.guild.roles.cache.find(role => role.id === showNotification.roleID).delete()
													.then(async () => {
														deleteList.push(showNotification.id);
													})
													.catch(console.error);
											}
											else {
												deleteList.push(showNotification.id);
											}
				            }
										if (showNotification.guild == message.guild.id && showNotification.groupRole != null && showNotification.groupRole != undefined && showNotification.groupRole != "") {
											if (await message.guild.roles.cache.find(role => role.id === showNotification.groupRole) != null) {
												await message.guild.roles.cache.find(role => role.id === showNotification.groupRole).delete()
													.then(async () => {
														deleteList.push(showNotification.id);
													})
													.catch(console.error);
											}
											else {
												deleteList.push(showNotification.id);
											}
										}
				          }

									for (var i = 0; i < deleteList.length; i++) {
										var tvShowsNotificationSettings = client.getTvShowsNotificationSettings.get(`${deleteList[i]}`);
										tvShowsNotificationSettings.roleID = null;
										tvShowsNotificationSettings.groupRole = null;
										tvShowsNotificationSettings.is_group = null;
										tvShowsNotificationSettings.groupName = null;
										tvShowsNotificationSettings.exclude = null;
										tvShowsNotificationSettings.include = null;
										client.setTvShowsNotificationSettings.run(tvShowsNotificationSettings);
									}

									for (const notificationSetting of client.searchNotificationSettings.iterate()) {
										if (notificationSetting.guild == message.guild.id && notificationSetting.roleID != null && notificationSetting.roleID != undefined && notificationSetting.roleID != "" && notificationSetting.category != "custom") {
											if (await message.guild.roles.cache.find(role => role.id === notificationSetting.roleID) != null) {
												await message.guild.roles.cache.find(role => role.id === notificationSetting.roleID).delete()
													.then(async () => {
														deleteNotificationList.push(notificationSetting.id);
													})
													.catch(console.error);
											}
											else {
												deleteNotificationList.push(notificationSetting.id);
											}
				            }
										if (notificationSetting.guild == message.guild.id && notificationSetting.roleID != null && notificationSetting.roleID != undefined && notificationSetting.roleID != "" && notificationSetting.category == "custom") {
											deleteCustomList.push(notificationSetting.id);
										}
									}

									for (var i = 0; i < deleteNotificationList.length; i++) {
										var notificationSettings = client.getNotificationSettings.get(`${deleteNotificationList[i]}`);
										notificationSettings.roleID = null;
										client.setNotificationSettings.run(notificationSettings);
									}

									for (var i = 0; i < deleteCustomList.length; i++) {
										client.deleteNotificationSettings.run(`${deleteCustomList[i]}`);    // delete a row based on id
										guildSettings.customRoleCount = guildSettings.customRoleCount - 1;
										client.setGuildSettings.run(guildSettings);
										guildSettings = client.getGuildSettings.get(message.guild.id);
										if (guildSettings.customRoleCount < 0) {
											guildSettings.customRoleCount = 0;
											client.setGuildSettings.run(guildSettings);
											guildSettings = client.getGuildSettings.get(message.guild.id);
											console.log("guildSettings.customRoleCount was out of bounds and reset to 0. Why did this happen?");
										}
									}

									await client.clearPreviousNotifierList.run(`${message.guild.id}`);  //clear notifier list too
									await client.clearRecentlyAddedShows.run(`${message.guild.id}`);  //clear clearRecentlyAddedShows list too
									await client.clearCustomReactRolePage.run(`${message.guild.id}`);  //clear clearCustomReactRolePage list too

								}
								count++;
							}

							if (count === 0) {
								embed = new Discord.MessageEmbed()
									.setDescription("Nothing selected in time, action cancelled!")
									.setTimestamp(new Date())
									.setColor(0x00AE86);
							}
							else {
								embed.setDescription(setDescription);
							}

							sentMessage.edit({embed});
						})
						.catch(console.error);
				})
				.then(async () => { await sentMessage.react(emojiOptions[1]) })
				.catch(() => console.error('One of the emojis failed to react.'));

		} else {
      return message.channel.send('You do not have permissions to use `' + prefix + 'delete`!');
    }
	},
};
