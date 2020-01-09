module.exports = {
	name: 'notifications',
  aliases: ['n'],
	description: 'Notification Settings that can be configured',
	usage: '[subcommand]',
	adminCommand: true,
	subcommands: {
		'edit':'',
		'custom add':'@mentionedRole Optional Description',
		'custom remove':'',
		'refresh':'',
		'reset':'',
		'include':'show',
		'group':'[show1] [show2] [etc.]',
		'ungroup':'[show1] [show2] [etc.]',
		'list':'',
		'channel':'',
	},
	async execute(message, args, prefix, guildSettings, client, Discord, tautulli, config, fetch, exemptEmbedReactRoles) {
    // This is where we change notification information

    let notificationSettings;
		var args2 = message.content.slice(prefix.length).trim().split(/ +/g);
    var ogCommand = args2.shift().toLowerCase();

    if (args.length > 0) {
      command = args.shift().toLowerCase();
    } else {
      command = "help";
    }

		if (command === "edit") {
      //enables certain notification options
			var emojiOptions = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
			const filter = (reaction, user) => emojiOptions.indexOf(reaction.emoji.name) != -1;

			exemptEmbedReactRoles.push(`Notification Role-Mention Options:`);
			var setDescription = "";
			embed = new Discord.RichEmbed()
				.setAuthor('Notification Role-Mention Options:') //don't foget to edit exemptEmbedReactRoles above if name changes so it is ignored in index.js role react
				.setTimestamp(new Date())
				.setColor(0x00AE86);

			var count = 0;
			var disabledItems = "";
			var disabledItemsList = [];
			var enabledItems = "";
			var enabledItemsList = [];
			var sortedEmojiList = {};
			var sortedRefernceList = {};
			for (const notificationSettings of client.searchNotificationSettings.iterate()) {
				if (notificationSettings.category != "networks" && notificationSettings.category != "custom") {
					if (notificationSettings.roleID === null || notificationSettings.roleID === undefined) {
						//disabledItems = disabledItems + `\n${emojiOptions[count]} **${notificationSettings.name}** ${notificationSettings.description}`;
						disabledItemsList.push(`**${notificationSettings.name}** ${notificationSettings.description}`);
						sortedRefernceList[`**${notificationSettings.name}** ${notificationSettings.description}`] = notificationSettings.id;
					}
					else {
						//enabledItems = enabledItems + `\n${emojiOptions[count]} <@&${notificationSettings.roleID}> ${notificationSettings.description}`;
						enabledItemsList.push(`<@&${notificationSettings.roleID}> ${notificationSettings.description}`);
						sortedRefernceList[`<@&${notificationSettings.roleID}> ${notificationSettings.description}`] = notificationSettings.id;
					}
					count++;
				}
			}

			for (var i = 0; i < disabledItemsList.length; i++) {
				disabledItems = disabledItems + `\n${emojiOptions[i]} ${disabledItemsList[i]}`;
				sortedEmojiList[emojiOptions[i]] = sortedRefernceList[disabledItemsList[i]];
			}
			var tempCount = 0;
			for (var i = disabledItemsList.length; i < (disabledItemsList.length + enabledItemsList.length); i++) {
				enabledItems = enabledItems + `\n${emojiOptions[i]} ${enabledItemsList[tempCount]}`;
				sortedEmojiList[emojiOptions[i]] = sortedRefernceList[enabledItemsList[tempCount]];
				tempCount++;
			}

			if (count < 1) {
				return message.channel.send("Something went wrong, nothing listed in database.");
			}
			else {
				if (disabledItems != "") {
					setDescription = "The following options are currently disabled but can be enabled now:\n" + disabledItems;
					if (enabledItems != "") {
						setDescription = setDescription + "\n\nThe following options are currently enabled but can be disabled now:\n" + enabledItems;
					}
				}
				else {
					setDescription = "The following options are currently enabled but can be disabled now:\n" + enabledItems;
				}
				embed.setDescription(setDescription);
			}

			let sentMessage = await message.channel.send({embed});
			sentMessage.react(emojiOptions[0])
			  .then(async () => {
					sentMessage.awaitReactions(filter, { time: 15000 })
				    .then(async collected => {
							var selectedEmojis = [];
							//console.log(`Collected ${collected.size} reactions`)
							collected.tap(selectedOptions => {
								if (selectedOptions.users.get(message.author.id) != undefined) {
									selectedEmojis.push(selectedOptions._emoji.name);
								}
							});

							var successfullyDisabledItems = "";
							var successfullyEnabledItems = "";
							embed = new Discord.RichEmbed()
								.setTimestamp(new Date())
								.setColor(0x00AE86);

							var count2 = 0;
							for(let emojis of selectedEmojis) {
								let notificationSettings = client.getNotificationSettings.get(sortedEmojiList[emojis]);
								//console.log(notificationSettings.name);

								if(notificationSettings.roleID != null) {
									//delete role and remove from database
									await message.guild.roles.find(role => role.id === notificationSettings.roleID).delete()
									  .then(async () => {
											notificationSettings.roleID = null;
											client.setNotificationSettings.run(notificationSettings);
					            notificationSettings = client.getNotificationSettings.get(sortedEmojiList[emojis]);

											successfullyDisabledItems = await successfullyDisabledItems + `\n > **${notificationSettings.name}** ${notificationSettings.description}`;
										})
									  .catch(console.error);
								}
								else {
									// Create role and store in database
									var role = await message.guild.roles.find(role => role.name === notificationSettings.name);

				          if (role) {
                    notificationSettings.roleID = role.id;
										client.setNotificationSettings.run(notificationSettings);
				            notificationSettings = client.getNotificationSettings.get(sortedEmojiList[emojis]);
				          }
				          else {
				            let newRole = await message.guild.createRole({
				              name: notificationSettings.name,
				              color: 'GREEN',
				              mentionable: true
				            })
				              .then(async role => {
												notificationSettings.roleID = role.id;
												client.setNotificationSettings.run(notificationSettings);
						            notificationSettings = client.getNotificationSettings.get(sortedEmojiList[emojis]);

												successfullyEnabledItems = await successfullyEnabledItems + `\n > <@&${notificationSettings.roleID}> ${notificationSettings.description}`;
				              })
				              .catch(console.error)
				          }
								}
								count2++;
							}

							if (count2 === 0) {
								embed = new Discord.RichEmbed()
									.setDescription("Nothing selected in time, nothing edited.")
									.setTimestamp(new Date())
									.setColor(0x00AE86);
							}
							else {
								if (successfullyEnabledItems != "") {
									setDescription = "**Successfully enabled the following:**" + successfullyEnabledItems;
									if (successfullyDisabledItems != "") {
										setDescription = setDescription + "\n\n**Successfully disabled the following:**" + successfullyDisabledItems;
									}
								}
								else {
									setDescription = "Successfully disabled the following:\n" + successfullyDisabledItems;
								}
								embed.setDescription(setDescription);
							}

							sentMessage.edit({embed});
						})
				    .catch(console.error);
			  })
				.then(async () => { if (count > 1) await sentMessage.react(emojiOptions[1]) })
				.then(async () => { if (count > 2) await sentMessage.react(emojiOptions[2]) })
				.then(async () => { if (count > 3) await sentMessage.react(emojiOptions[3]) })
				.then(async () => { if (count > 4) await sentMessage.react(emojiOptions[4]) })
				.then(async () => { if (count > 5) await sentMessage.react(emojiOptions[5]) })
				.then(async () => { if (count > 6) await sentMessage.react(emojiOptions[6]) })
				.then(async () => { if (count > 7) await sentMessage.react(emojiOptions[7]) })
				.then(async () => { if (count > 8) await sentMessage.react(emojiOptions[8]) })
				.then(async () => { if (count > 9) await sentMessage.react(emojiOptions[9]) })
				.catch(() => console.error('One of the emojis failed to react.'));







      var networksSetDescription = "";
			exemptEmbedReactRoles.push(`TV Network Options:`);
			embed2 = new Discord.RichEmbed()
				.setAuthor('TV Network Options:') //don't foget to edit exemptEmbedReactRoles above if name changes so it is ignored in index.js role react
				.setTimestamp(new Date())
				.setColor(0x00AE86);

			var networksCount = 0;
			var networksDisabledItems = "";
			var networksDisabledItemsList = [];
			var networksEnabledItems = "";
			var networksEnabledItemsList = [];
			var networksSortedEmojiList = {};
			var networksSortedRefernceList = {};
			for (const notificationSettings of client.searchNotificationSettings.iterate()) {
				if (notificationSettings.category === "networks") {
					if (notificationSettings.roleID === null || notificationSettings.roleID === undefined) {
						networksDisabledItemsList.push(`**${notificationSettings.name}** ${notificationSettings.description}`);
						networksSortedRefernceList[`**${notificationSettings.name}** ${notificationSettings.description}`] = notificationSettings.id;
					}
					else {
						networksEnabledItemsList.push(`<@&${notificationSettings.roleID}> ${notificationSettings.description}`);
						networksSortedRefernceList[`<@&${notificationSettings.roleID}> ${notificationSettings.description}`] = notificationSettings.id;
					}
					networksCount++;
				}
			}

			for (var i = 0; i < networksDisabledItemsList.length; i++) {
				networksDisabledItems = networksDisabledItems + `\n${emojiOptions[i]} ${networksDisabledItemsList[i]}`;
				networksSortedEmojiList[emojiOptions[i]] = networksSortedRefernceList[networksDisabledItemsList[i]];
			}
			var tempCount2 = 0;
			for (var i = networksDisabledItemsList.length; i < (networksDisabledItemsList.length + networksEnabledItemsList.length); i++) {
				networksEnabledItems = networksEnabledItems + `\n${emojiOptions[i]} ${networksEnabledItemsList[tempCount2]}`;
				networksSortedEmojiList[emojiOptions[i]] = networksSortedRefernceList[networksEnabledItemsList[tempCount2]];
				tempCount2++;
			}

			if (networksCount < 1) {
				return message.channel.send("Something went wrong, nothing listed in database.");
			}
			else {
				if (networksDisabledItems != "") {
					networksSetDescription = "The following TV Networks are currently disabled but can be enabled now:\n" + networksDisabledItems;
					if (networksEnabledItems != "") {
						networksSetDescription = networksSetDescription + "\n\nThe following TV Networks are currently enabled but can be disabled now:\n" + networksEnabledItems;
					}
				}
				else {
					networksSetDescription = "The following TV Networks are currently enabled but can be disabled now:\n" + networksEnabledItems;
				}
				embed2.setDescription(networksSetDescription);
			}

			let sentMessage2 = await message.channel.send({embed: embed2});
			sentMessage2.react(emojiOptions[0])
			  .then(async () => {
					sentMessage2.awaitReactions(filter, { time: 15000 })
				    .then(async collected => {
							var selectedEmojis = [];
							//console.log(`Collected ${collected.size} reactions`)
							collected.tap(selectedOptions => {
								if (selectedOptions.users.get(message.author.id) != undefined) {
									selectedEmojis.push(selectedOptions._emoji.name);
								}
							});

							var successfullyDisabledItems = "";
							var successfullyEnabledItems = "";
							embed2 = new Discord.RichEmbed()
								.setTimestamp(new Date())
								.setColor(0x00AE86);

							var count2 = 0;
							for(let emojis of selectedEmojis) {
								let notificationSettings = client.getNotificationSettings.get(networksSortedEmojiList[emojis]);
								//console.log(notificationSettings.name);

								if(notificationSettings.roleID != null) {
									//delete role and remove from database
									await message.guild.roles.find(role => role.id === notificationSettings.roleID).delete()
									  .then(async () => {
											notificationSettings.roleID = null;
											client.setNotificationSettings.run(notificationSettings);
					            notificationSettings = client.getNotificationSettings.get(networksSortedEmojiList[emojis]);

											successfullyDisabledItems = await successfullyDisabledItems + `\n > **${notificationSettings.name}** ${notificationSettings.description}`;
										})
									  .catch(console.error);
								}
								else {
									// Create role and store in database
									var role = await message.guild.roles.find(role => role.name === notificationSettings.name);

				          if (role) {
                    notificationSettings.roleID = role.id;
										client.setNotificationSettings.run(notificationSettings);
				            notificationSettings = client.getNotificationSettings.get(networksSortedEmojiList[emojis]);
				          }
				          else {
				            let newRole = await message.guild.createRole({
				              name: notificationSettings.name,
				              color: 'GREEN',
				              mentionable: true
				            })
				              .then(async role => {
												notificationSettings.roleID = role.id;
												client.setNotificationSettings.run(notificationSettings);
						            notificationSettings = client.getNotificationSettings.get(networksSortedEmojiList[emojis]);

												successfullyEnabledItems = await successfullyEnabledItems + `\n > <@&${notificationSettings.roleID}> ${notificationSettings.description}`;
				              })
				              .catch(console.error)
				          }
								}
								count2++;
							}

							if (count2 === 0) {
								embed2 = new Discord.RichEmbed()
									.setDescription("Nothing selected in time, nothing edited.")
									.setTimestamp(new Date())
									.setColor(0x00AE86);
							}
							else {
								if (successfullyEnabledItems != "") {
									networksSetDescription = "**Successfully enabled the following TV Networks:**" + successfullyEnabledItems;
									if (successfullyDisabledItems != "") {
										networksSetDescription = networksSetDescription + "\n\n**Successfully disabled the following TV Networks:**" + successfullyDisabledItems;
									}
								}
								else {
									networksSetDescription = "Successfully disabled the following TV Networks:\n" + successfullyDisabledItems;
								}
								embed2.setDescription(networksSetDescription);
							}

							sentMessage2.edit({embed: embed2});
						})
				    .catch(console.error);
			  })
				.then(async () => { if (networksCount > 1) await sentMessage2.react(emojiOptions[1]) })
				.then(async () => { if (networksCount > 2) await sentMessage2.react(emojiOptions[2]) })
				.then(async () => { if (networksCount > 3) await sentMessage2.react(emojiOptions[3]) })
				.then(async () => { if (networksCount > 4) await sentMessage2.react(emojiOptions[4]) })
				.then(async () => { if (networksCount > 5) await sentMessage2.react(emojiOptions[5]) })
				.then(async () => { if (networksCount > 6) await sentMessage2.react(emojiOptions[6]) })
				.then(async () => { if (networksCount > 7) await sentMessage2.react(emojiOptions[7]) })
				.then(async () => { if (networksCount > 8) await sentMessage2.react(emojiOptions[8]) })
				.then(async () => { if (networksCount > 9) await sentMessage2.react(emojiOptions[9]) })
				.catch(() => console.error('One of the emojis failed to react.'));

    }
		else if (command === "custom") {
      // custom notification settings, user is in charge of managing roles
			if (args.length > 0) {
        if (message.channel.guild.member(message.author).hasPermission('ADMINISTRATOR')) {
          command = args.shift().toLowerCase();
					if (command === "add") {
						let mentionedRole = message.mentions.roles.first();
			      if(!mentionedRole) {
			        return message.channel.send("You did not specify a valid role for that command, please try again.");
			      } else {
							// add custom role
							if (guildSettings.customRoleCount + 1 > 6) {
								return message.channel.send("You have hit the custom react role limit of 6, please remove a custom react role to add a new one");
							}
							else {
								var description = '';
								let notificationSettings;

								description = message.content.slice(message.content.indexOf(">") + 1, message.content.length).trim();

								notificationSettings = { id: `${message.guild.id}-${client.user.id}-${mentionedRole.id}`, guild: message.guild.id, name: `Custom-${mentionedRole.id}`, category: `custom`, description: description, roleID: mentionedRole.id };
								client.setNotificationSettings.run(notificationSettings);

								guildSettings.customRoleCount = guildSettings.customRoleCount + 1;
								client.setGuildSettings.run(guildSettings);
			          guildSettings = client.getGuildSettings.get(message.guild.id);

								return message.channel.send("Custom react role successfully added!");
							}
			      }
					}
					else if (command === "delete" || command === "remove") {
						// generate embed list to react role and delete
						var customList = {};
						var customList2 = {};

						var emojiOptions = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
						const filter = (reaction, user) => emojiOptions.indexOf(reaction.emoji.name) != -1;

						var setDescription = "The following custom react roles can be removed:\n\n";
						exemptEmbedReactRoles.push(`Custom React Role Removal:`);
						embed = new Discord.RichEmbed()
							.setAuthor('Custom React Role Removal:') //don't foget to edit exemptEmbedReactRoles above if name changes so it is ignored in index.js role react
							.setTimestamp(new Date())
							.setColor(0x00AE86);

						var count = 0;
						for (const notificationSettings of client.searchNotificationSettings.iterate()) {
							if (notificationSettings.category === "custom") {
								customList[emojiOptions[count]] = `${notificationSettings.roleID}`;
								setDescription = setDescription + "\n" + `${emojiOptions[count]} <@&${notificationSettings.roleID}> ${notificationSettings.description}`;
								customList2[emojiOptions[count]] = `<@&${notificationSettings.roleID}> ${notificationSettings.description}`;
								count++;
							}
						}

						if (count < 1) {
							return message.channel.send("There is nothing to remove.");
						}
						else {
							embed.setDescription(setDescription);
						}

						let sentMessage = await message.channel.send({embed});
						sentMessage.react(emojiOptions[0])
						  .then(async () => {
								sentMessage.awaitReactions(filter, { time: 15000 })
							    .then(collected => {
										var selectedEmojis = [];
										collected.tap(selectedOptions => {
											if (selectedOptions.users.get(message.author.id) != undefined) {
												selectedEmojis.push(selectedOptions._emoji.name);
											}
										});
										var setDescription = "Successfully removed the following Custom React Roles:\n(*Don't forget to delete the role in Discord, I don't manage custom roles!*)\n\n";
										embed = new Discord.RichEmbed()
											.setTimestamp(new Date())
											.setColor(0x00AE86);

										var count2 = 0;
										for(let emojis of selectedEmojis) {
						          client.deleteNotificationSettings.run(`${message.guild.id}-${client.user.id}-${customList[emojis]}`);    // delete a row based on id
											guildSettings.customRoleCount = guildSettings.customRoleCount - 1;
											client.setGuildSettings.run(guildSettings);
						          guildSettings = client.getGuildSettings.get(message.guild.id);

											setDescription = setDescription + "\n" + `${customList2[emojis]}`;
											count2++;
										}

										if (count2 === 0) {
											embed = new Discord.RichEmbed()
												.setDescription("Nothing selected in time, no custom React Roles were removed.")
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
							.then(async () => { if (count > 1) await sentMessage.react(emojiOptions[1]) })
							.then(async () => { if (count > 2) await sentMessage.react(emojiOptions[2]) })
							.then(async () => { if (count > 3) await sentMessage.react(emojiOptions[3]) })
							.then(async () => { if (count > 4) await sentMessage.react(emojiOptions[4]) })
							.then(async () => { if (count > 5) await sentMessage.react(emojiOptions[5]) })
							.then(async () => { if (count > 6) await sentMessage.react(emojiOptions[6]) })
							.then(async () => { if (count > 7) await sentMessage.react(emojiOptions[7]) })
							.then(async () => { if (count > 8) await sentMessage.react(emojiOptions[8]) })
							.then(async () => { if (count > 9) await sentMessage.react(emojiOptions[9]) })
							.catch(() => console.error('One of the emojis failed to react.'));

					}
					else {
						return message.channel.send('Invalid use of `' + prefix + 'notifications custom`, please try again.');
					}
        }
        else {
          return message.channel.send('You do not have permissions to use `' + prefix + 'notifications custom` in <#' + message.channel.id + '>!');
        }
      } else {
        return message.channel.send("This is to enable custom react roles. You are in charge of creating/deleting the roles. To use it, type: `" + prefix + "notifications custom add @role Optional description of role`");
      }
    }
    else if (command === "refresh") {
      // grabs list of currently airing shows and adds them to notifications channel
    }
    else if (command === "reset") {
      // Alphabetically re-sort items in notfication settings embed
    }
    else if (command === "include") {
      // Manually include a show in notification settings embed
    }
    else if (command === "exclude") {
      // Manually exclude a show in notification settings embed
    }
    else if (command === "group") {
      // Group up Multiple Items
    }
    else if (command === "ungroup") {
      // Ungroup up Multiple Items
    }
    else if (command === "list") {
      // List the items that have been manually added as well as currently airing
      if (!message.channel.guild.member(message.author).hasPermission('ADMINISTRATOR')) {
        return message.channel.send('You do not have permissions to use `' + prefix + ogCommand + " " + command + '`!');
      }
			const mainProgram = require("../index.js");
      await mainProgram.updateShowList(message);

      var tenNumbers = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
      var showsList = [];
      var sortList = [];
      var count = 0;
      for (const notificationQuery of client.searchTvShowsNotificationSettings.iterate()) {
        if (notificationQuery.guild === message.guild.id && notificationQuery.exclude === null) {
          if (notificationQuery.groupName != null) {
            var bypass = true;
            for (var i = 0; i < sortList.length; i++) {
              if (sortList[i] === notificationQuery.groupName) {
                bypass = false;
              }
            }
            if (bypass) {
              sortList[count] = notificationQuery.groupName;
              count++;
            }
          }
          else {
            sortList[count] = notificationQuery.sortTitle;
            count++;
          }
        }
      }
      sortList = sortList.sort();

      for (var i = 0; i < sortList.length; i++) {
        notificationSettings = client.getTvShowsNotificationSettingsBySortTitle.get(sortList[i]);
        if (!notificationSettings) {
          // GroupName
          notificationSettings = client.getTvShowsNotificationSettingsByGroupName.get(sortList[i]);
          var role = message.guild.roles.find(role => role.id === notificationSettings.groupRole);
          if (role != null) {
            showsList[i] = role;
          }
          else {
            showsList[i] = notificationSettings.groupName;
          }
        }
        else {
          var role = message.guild.roles.find(role => role.id === notificationSettings.roleID);
          if (role != null) {
            showsList[i] = role;
          }
          else {
            showsList[i] = notificationSettings.title;
          }
        }
      }

      var total = showsList.length;
      for (var pages = 0; (pages*10) < total; pages++) {
        embed = new Discord.RichEmbed()
          .setColor(0x00AE86);
        if (pages === 0) {
          embed.setAuthor("Choose what individual TV Shows you would like to be notified for:")
        }
        else {
          embed.setAuthor("Page " + (pages + 1));
        }

        var emojiCount = 0;
        var pageBody = "";
        for (var i = 0; i < tenNumbers.length; i++) {
          if (showsList[(pages*10) + i]) {
            pageBody = pageBody + tenNumbers[i] + " " + showsList[(pages*10) + i] + "\n";
            emojiCount++;
          }
        }
        embed.setDescription(pageBody);
        var emojiTime = await message.channel.send({embed});
        for (var i = 0; i < emojiCount; i++) {
          await emojiTime.react(tenNumbers[i])
            .then()
            .catch(console.error);
        }
      }
    }
    else if (command === "channel") {
      // Sets the notification channel or turns it off
      if (args.length > 0) {
        let mentionedChannel = message.mentions.channels.first();
        if(!mentionedChannel) {
          command = args.shift().toLowerCase();
          if (command === "off") {
            // disable notification channel
            guildSettings.notificationChannelBoolean = "off";
            client.setGuildSettings.run(guildSettings);
            guildSettings = client.getGuildSettings.get(message.guild.id);
            message.channel.send("Notifications disabled!");
          } else {
            return message.channel.send("You did not specify a valid channel to set the notification channel to!");
          }
        }
        else if (message.channel.guild.member(message.author).hasPermission('ADMINISTRATOR')) {
          guildSettings.notificationChannel = mentionedChannel.id;
          guildSettings.notificationChannelBoolean = "on";
          client.setGuildSettings.run(guildSettings);
          guildSettings = client.getGuildSettings.get(message.guild.id);
          message.channel.send("Notification channel changed to <#" + guildSettings.notificationChannel + ">!");
        } else {
          return message.channel.send('You do not have permissions to use `' + prefix + ogCommand + ' channel` in <#' + message.channel.id + '>!');
        }
      } else {
        return message.channel.send("The current notification channel is <#" + guildSettings.notificationChannel + ">!\nTo change it type: `" + guildSettings.prefix + ogCommand + " channel #logs` (where **#logs** is the desired channel)\nTo disable it type: `" + guildSettings.prefix + ogCommand + " channel off`");
      }
    }
  },
};
