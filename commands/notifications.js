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
		'library':'',
		'exclude':'show',
		'include':'show',
		'group':'New Group Name for Shows [show1] [show2] [etc.]',
		'ungroup':'[show1] [show2] [etc.]',
		'list':'',
		'channel':'',
	},
	async execute(message, args, prefix, guildSettings, client, Discord, config, fetch, exemptEmbedReactRoles, tautulli, sonarr) {
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
						if (notificationSettings.id === `${message.guild.id}-${client.user.id}-${notificationSettings.name}`) {
							//Check to make sure client id is the same, in case using a different bot token
							disabledItemsList.push(`**${notificationSettings.name}** ${notificationSettings.description}`);
							sortedRefernceList[`**${notificationSettings.name}** ${notificationSettings.description}`] = notificationSettings.id;
						}
					}
					else {
						if (notificationSettings.id === `${message.guild.id}-${client.user.id}-${notificationSettings.name}`) {
							//Check to make sure client id is the same, in case using a different bot token
							enabledItemsList.push(`<@&${notificationSettings.roleID}> ${notificationSettings.description}`);
							sortedRefernceList[`<@&${notificationSettings.roleID}> ${notificationSettings.description}`] = notificationSettings.id;
						}
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
						if (notificationSettings.id === `${message.guild.id}-${client.user.id}-${notificationSettings.name}`) {
							//Check to make sure client id is the same, in case using a different bot token
							networksDisabledItemsList.push(`**${notificationSettings.name}** ${notificationSettings.description}`);
							networksSortedRefernceList[`**${notificationSettings.name}** ${notificationSettings.description}`] = notificationSettings.id;
						}
					}
					else {
						if (notificationSettings.id === `${message.guild.id}-${client.user.id}-${notificationSettings.name}`) {
							//Check to make sure client id is the same, in case using a different bot token
							networksEnabledItemsList.push(`<@&${notificationSettings.roleID}> ${notificationSettings.description}`);
							networksSortedRefernceList[`<@&${notificationSettings.roleID}> ${notificationSettings.description}`] = notificationSettings.id;
						}
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
								if (notificationSettings.id === `${message.guild.id}-${client.user.id}-${notificationSettings.roleID}`) {
									//Check to make sure client id is the same, in case using a different bot token
									customList[emojiOptions[count]] = `${notificationSettings.roleID}`;
									setDescription = setDescription + "\n" + `${emojiOptions[count]} <@&${notificationSettings.roleID}> ${notificationSettings.description}`;
									customList2[emojiOptions[count]] = `<@&${notificationSettings.roleID}> ${notificationSettings.description}`;
									count++;
								}
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
		else if (command === "library" ) {
			// allows a library name to be excluded from recently added notifications
			let library = await tautulli.tautulliService.getLibraries();
			library = library.data;
			let libraryExclusionList;
			var customList = [];

			for (var i = 0; i < library.length; i++) {
				customList.push(library[i].section_name.trim());
				libraryExclusionList = client.getLibraryExclusionSettings.get(`${message.guild.id}-${client.user.id}-${library[i].section_name.trim()}`);
				if (!libraryExclusionList) {
					libraryExclusionList = { id: `${message.guild.id}-${client.user.id}-${library[i].section_name.trim()}`, guild: message.guild.id, name: library[i].section_name.trim(), excluded: "false" };
					client.setLibraryExclusionSettings.run(libraryExclusionList);
					libraryExclusionList = client.getLibraryExclusionSettings.get(`${message.guild.id}-${client.user.id}-${library[i].section_name.trim()}`);
				}
			}

			for (const exclusionList of client.searchLibraryExclusionSettings.iterate()) {
				// Deletes an old library
				var deleteLibrary = true;
				for (var i = 0; i < library.length; i++) {
          if (exclusionList.name === library[i].section_name.trim()) {
						deleteLibrary = false;
					}
				}
				if (deleteLibrary) {
					client.deleteNotificationSettings.run(`${exclusionList.id}`);
				}
			}

			var customList2 = {};

			var emojiOptions = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
			const filter = (reaction, user) => emojiOptions.indexOf(reaction.emoji.name) != -1;

			var setDescription = "The following libraries can be excluded from recently added notifications:\n";
			exemptEmbedReactRoles.push(`Library Exclusion:`);
			embed = new Discord.RichEmbed()
				.setAuthor('Library Exclusion:') //don't foget to edit exemptEmbedReactRoles above if name changes so it is ignored in index.js role react
				.setTimestamp(new Date())
				.setColor(0x00AE86);

			var count = 0;
			for (const exclusionList of client.searchLibraryExclusionSettings.iterate()) {
				if (exclusionList.excluded === "false") {
					if (exclusionList.id === `${message.guild.id}-${client.user.id}-${exclusionList.name}`) {
						//Check to make sure client id is the same, in case using a different bot token
						customList2[emojiOptions[count]] = `${exclusionList.name}`;
						setDescription = setDescription + "\n" + `${emojiOptions[count]} ${exclusionList.name}`;
						count++;
					}
				}
			}
			if (count < 1) {
				setDescription = "The following libraries are currently excluded from recently added notifications but can be included:\n";
			}
			var setDescription2 = "";

			for (const exclusionList of client.searchLibraryExclusionSettings.iterate()) {
				if (exclusionList.excluded === "true") {
					customList2[emojiOptions[count]] = `${exclusionList.name}`;
					setDescription2 = setDescription2 + "\n" + `${emojiOptions[count]} ${exclusionList.name}`;
					count++;
				}
			}
			if (setDescription2 != "") {
				setDescription = setDescription + "\n\nThe following libraries are currently excluded from recently added notifications but can be included:\n" + setDescription2;
			}

			if (count < 1) {
				return message.channel.send("No Plex Libraries found, check your tautulli settings.");
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

							var excludedItemsList = [];
							var includedItemsList = [];
							var sortedEmojiList = {};

							for (var i = 0; i < selectedEmojis.length; i++) {
								libraryExclusionList = client.getLibraryExclusionSettings.get(`${message.guild.id}-${client.user.id}-${customList2[selectedEmojis[i]]}`);
								if (libraryExclusionList && libraryExclusionList.excluded === "false") {
									libraryExclusionList.excluded = "true";
									excludedItemsList.push(customList2[selectedEmojis[i]]);
								}
								else if (libraryExclusionList && libraryExclusionList.excluded === "true") {
									libraryExclusionList.excluded = "false";
									includedItemsList.push(customList2[selectedEmojis[i]]);
								}
								client.setLibraryExclusionSettings.run(libraryExclusionList);
								libraryExclusionList = client.getLibraryExclusionSettings.get(`${message.guild.id}-${client.user.id}-${customList2[selectedEmojis[i]]}`);
							}

							var setResponseDescription = "";
							embed = new Discord.RichEmbed()
								.setTimestamp(new Date())
								.setColor(0x00AE86);

							if (excludedItemsList.length > 0) {
								setResponseDescription = "**Successfully excluded the following libraries from recently added notifications:**";
								for (var i = 0; i < excludedItemsList.length; i++) {
									setResponseDescription = setResponseDescription + "\n> " + excludedItemsList[i];
								}
								if (includedItemsList.length > 0) {
									setResponseDescription = setResponseDescription + "\n\n**Successfully included the following libraries for recently added notifications:**";
									for (var i = 0; i < includedItemsList.length; i++) {
										setResponseDescription = setResponseDescription + "\n> " + includedItemsList[i];
									}
								}
								embed.setDescription(setResponseDescription);
							}
							else if (includedItemsList.length > 0) {
								setResponseDescription = "**Successfully included the following libraries for recently added notifications:**";
								for (var i = 0; i < includedItemsList.length; i++) {
									setResponseDescription = setResponseDescription + "\n> " + includedItemsList[i];
								}
								embed.setDescription(setResponseDescription);
							}
							else {
								embed = new Discord.RichEmbed()
									.setDescription("Nothing selected in time, no libraries were excluded.")
									.setTimestamp(new Date())
									.setColor(0x00AE86);
							}

							sentMessage.edit({embed});
							tautulli.tautulliService.updateTautulliHook();
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
    else if (command === "refresh") {
      // grabs list of currently airing shows and adds them to notifications channel
    }
    else if (command === "reset") {
      // Alphabetically re-sort items in notfication settings embed
    }
		else if (command === "exclude" ) {
			// Manually exclude a show in notification settings embed
			var messageAfterCommand = message.content.slice(message.content.indexOf(command) + command.length + 1);
	    if (message.content.length < message.content.indexOf(command) + command.length + 1) {
	 		  return message.channel.send("You didn't state a show to exclude!");
	 	  }

			var emojiOptions = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
			const filter = (reaction, user) => emojiOptions.indexOf(reaction.emoji.name) != -1;
			var setDescription = "";

			var findExemptEmbedReactRoles = false;
			for (let exemptNames of exemptEmbedReactRoles) {
				if(`Sonarr Show Lookup:` === exemptNames) findExemptEmbedReactRoles = true;
			}
			if (!findExemptEmbedReactRoles) exemptEmbedReactRoles.push(`Sonarr Show Lookup:`);
			embed = new Discord.RichEmbed()
				.setAuthor('Sonarr Show Lookup:') //don't foget to edit exemptEmbedReactRoles above if name changes so it is ignored in index.js role react
				.setTimestamp(new Date())
				.setColor(0x00AE86);

			var json = await sonarr.sonarrService.lookUpSeries(messageAfterCommand);
			if (json == "error") {
				console.log("Couldn't connect to Sonarr, check your settings.");
				return message.channel.send("Couldn't connect to Sonarr, check your settings.");
			}
			var description = "Select the emoji that corresponds to the show you want to exclude:\n";
			var count = 0;
			var showEmojiList = {};
			for (var i = 0; i < json.length; i++) {
				if (count >= 9) break;
				for (const tvNotificationSettings of client.searchTvShowsNotificationSettings.iterate()) {
					if (tvNotificationSettings.thetvdb_id == json[i].tvdbId) {
	          description = description + "\n" + emojiOptions[count] + " " + json[i].title + " (" + json[i].year + ") " + "[[TheTVDb](http://thetvdb.com/?tab=series&id=" + json[i].tvdbId + ")]";
						showEmojiList[emojiOptions[count]] = `${json[i].cleanTitle}-${json[i].imdbId}-${message.guild.id}`;
						count++;
					}
				}
			}

			if (count == 0) {
				return message.channel.send("No shows found on server matching that criteria.");
			}

			embed.setDescription(description);

			let sentMessage = await message.channel.send({embed});
			sentMessage.react(emojiOptions[0])
				.then(async () => {
					sentMessage.awaitReactions(filter, { time: 15000 })
						.then(async collected => {
							var selectedEmojis = [];
							collected.tap(selectedOptions => {
								if (selectedOptions.users.get(message.author.id) != undefined) {
									selectedEmojis.push(selectedOptions._emoji.name);
								}
							});

							let tvShowsNotificationSettings;
							var setDescription = "";
							var count2 = 0;

							for(let emojis of selectedEmojis) {
								tvShowsNotificationSettings = client.getTvShowsNotificationSettings.get(showEmojiList[emojis]);
								if (tvShowsNotificationSettings.roleID != null || tvShowsNotificationSettings.roleID != undefined) {
									count2++;
									await message.guild.roles.find(role => role.id === tvShowsNotificationSettings.roleID).delete()
										.then(async () => {
											tvShowsNotificationSettings.exclude = "true";
											tvShowsNotificationSettings.include = null;
											tvShowsNotificationSettings.roleID = null;
											setDescription = setDescription + "\n > " + tvShowsNotificationSettings.title;
											client.setTvShowsNotificationSettings.run(tvShowsNotificationSettings);
											tvShowsNotificationSettings = client.getTvShowsNotificationSettings.get(showEmojiList[emojis]);
										})
										.catch(console.error);
								}
							}

							if (count2 === 0) {
								embed = new Discord.RichEmbed()
									.setDescription("Nothing selected in time, nothing excluded.")
									.setTimestamp(new Date())
									.setColor(0x00AE86);
							}
							else {
								if (count2 == 1) {
									setDescription = "Successfully excluded the following show:" + setDescription;
								}
								else {
									setDescription = "Successfully excluded the following shows:" + setDescription;
								}
								embed = new Discord.RichEmbed()
									.setDescription(setDescription)
									.setTimestamp(new Date())
									.setColor(0x00AE86);
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
    else if (command === "include") {
      // Manually include a show in notification settings embed
			var messageAfterCommand = message.content.slice(message.content.indexOf(command) + command.length + 1);
	    if (message.content.length < message.content.indexOf(command) + command.length + 1) {
	 		  return message.channel.send("You didn't state a show to include!");
	 	  }

			var emojiOptions = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
			const filter = (reaction, user) => emojiOptions.indexOf(reaction.emoji.name) != -1;
			var setDescription = "";

			var findExemptEmbedReactRoles = false;
			for (let exemptNames of exemptEmbedReactRoles) {
				if(`Sonarr Show Lookup:` === exemptNames) findExemptEmbedReactRoles = true;
			}
			if (!findExemptEmbedReactRoles) exemptEmbedReactRoles.push(`Sonarr Show Lookup:`);
			embed = new Discord.RichEmbed()
				.setAuthor('Sonarr Show Lookup:') //don't foget to edit exemptEmbedReactRoles above if name changes so it is ignored in index.js role react
				.setTimestamp(new Date())
				.setColor(0x00AE86);

			var json = await sonarr.sonarrService.lookUpSeries(messageAfterCommand);
			if (json == "error") {
				console.log("Couldn't connect to Sonarr, check your settings.");
				return message.channel.send("Couldn't connect to Sonarr, check your settings.");
			}
			var description = "Select the emoji that corresponds to the show you want to include:\n";
			var count = 0;
			var showEmojiList = {};
			for (var i = 0; i < json.length; i++) {
				if (count >= 9) break;
				for (const tvNotificationSettings of client.searchTvShowsNotificationSettings.iterate()) {
					if (tvNotificationSettings.thetvdb_id == json[i].tvdbId) {
	          description = description + "\n" + emojiOptions[count] + " " + json[i].title + " (" + json[i].year + ") " + "[[TheTVDb](http://thetvdb.com/?tab=series&id=" + json[i].tvdbId + ")]";
						showEmojiList[emojiOptions[count]] = `${json[i].cleanTitle}-${json[i].imdbId}-${message.guild.id}`;
						count++;
					}
				}
			}

			if (count == 0) {
				return message.channel.send("No shows found on server matching that criteria.");
			}

			embed.setDescription(description);

			let sentMessage = await message.channel.send({embed});
			sentMessage.react(emojiOptions[0])
				.then(async () => {
					sentMessage.awaitReactions(filter, { time: 15000 })
						.then(async collected => {
							var selectedEmojis = [];
							collected.tap(selectedOptions => {
								if (selectedOptions.users.get(message.author.id) != undefined) {
									selectedEmojis.push(selectedOptions._emoji.name);
								}
							});

							let tvShowsNotificationSettings;
							var setDescription = "";
							var count2 = 0;

							for(let emojis of selectedEmojis) {
								tvShowsNotificationSettings = client.getTvShowsNotificationSettings.get(showEmojiList[emojis]);
								if (tvShowsNotificationSettings.roleID === null || tvShowsNotificationSettings.roleID === undefined) {
									// Create role and store in database
									let newRole = await message.guild.createRole({
										name: tvShowsNotificationSettings.title,
										color: 'BLUE',
										mentionable: true
									})
										.then(async role => {
											tvShowsNotificationSettings.exclude = null;
											tvShowsNotificationSettings.include = "true";
											tvShowsNotificationSettings.roleID = role.id;
											setDescription = setDescription + "\n > " + tvShowsNotificationSettings.title;
											client.setTvShowsNotificationSettings.run(tvShowsNotificationSettings);
											tvShowsNotificationSettings = client.getTvShowsNotificationSettings.get(showEmojiList[emojis]);
										})
										.catch(console.error)
									count2++;
								}
							}

							if (count2 === 0) {
								embed = new Discord.RichEmbed()
									.setDescription("Nothing selected in time, nothing included.")
									.setTimestamp(new Date())
									.setColor(0x00AE86);
							}
							else {
								if (count2 == 1) {
									setDescription = "Successfully included the following show:" + setDescription;
								}
								else {
									setDescription = "Successfully included the following shows:" + setDescription;
								}
								embed = new Discord.RichEmbed()
									.setDescription(setDescription)
									.setTimestamp(new Date())
									.setColor(0x00AE86);
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
    else if (command === "group") {
			// Group up Multiple Items
			var messageAfterCommand = message.content.slice(message.content.indexOf(command) + command.length + 1);
	    if (message.content.length < message.content.indexOf(command) + command.length + 1) {
	 		  return message.channel.send("You didn't state a name or shows to group up!");
	 	  }

			var groupName = "";
			var showNamesToSearch = [];
			if (messageAfterCommand.indexOf("[") === -1) return message.channel.send("You didn't state any shows to group up!");
			groupName = messageAfterCommand.slice(0, messageAfterCommand.indexOf("[")).trim();
			messageAfterCommand = messageAfterCommand.slice(messageAfterCommand.indexOf("["), messageAfterCommand.length).trim();
			var showCount = 0;
			var keepGoing =  true;

			while(keepGoing) {
				if (messageAfterCommand.indexOf("[") === -1) {
					keepGoing = false;
					break;
				}
        var show = messageAfterCommand.slice(messageAfterCommand.indexOf("[") + 1, messageAfterCommand.indexOf("]")).trim();
				messageAfterCommand = messageAfterCommand.slice(messageAfterCommand.indexOf("]") + 1, messageAfterCommand.length).trim();
				showNamesToSearch.push(show);
			}

			if (groupName == "" || showNamesToSearch.length <= 1) {
				return message.channel.send("Invalid command format, nothing grouped!\nYou need to state at least 2 shows to group up in the format of " + prefix + ogCommand + " " + command + " Group Name [show1] [show2]");
			}

			var emojiOptions = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
			const filter = (reaction, user) => emojiOptions.indexOf(reaction.emoji.name) != -1;
			var setDescription = "";

			var findExemptEmbedReactRoles = false;
			for (let exemptNames of exemptEmbedReactRoles) {
				if(`Sonarr Show Lookup:` === exemptNames) findExemptEmbedReactRoles = true;
			}
			if (!findExemptEmbedReactRoles) exemptEmbedReactRoles.push(`Sonarr Show Lookup:`);
			embed = new Discord.RichEmbed()
				.setAuthor('Sonarr Show Lookup:') //don't foget to edit exemptEmbedReactRoles above if name changes so it is ignored in index.js role react
				.setTimestamp(new Date())
				.setColor(0x00AE86);

			//var json = await sonarr.sonarrService.lookUpSeries(showNamesToSearch[i]);
			var description = "Select the emojis that correspond to the shows you want to group up:\n";
			var count = 0;
			var showEmojiList = {};
			for (var j = 0; j < showNamesToSearch.length; j++) {
	      var json = await sonarr.sonarrService.lookUpSeries(showNamesToSearch[j]);
				if (json == "error") {
					console.log("Couldn't connect to Sonarr, check your settings.");
					return message.channel.send("Couldn't connect to Sonarr, check your settings.");
				}
				for (var i = 0; i < json.length; i++) {
					if (count >= 9) break;
					for (const tvNotificationSettings of client.searchTvShowsNotificationSettings.iterate()) {
						if (tvNotificationSettings.thetvdb_id == json[i].tvdbId) {
              var isDuplicate = false;
							for (let x in showEmojiList) {
								if (showEmojiList[x] == `${json[i].cleanTitle}-${json[i].imdbId}-${message.guild.id}`) isDuplicate = true;
							}
							if (!isDuplicate) {
								showEmojiList[emojiOptions[count]] = `${json[i].cleanTitle}-${json[i].imdbId}-${message.guild.id}`;
								description = description + "\n" + emojiOptions[count] + " " + json[i].title + " (" + json[i].year + ") " + "[[TheTVDb](http://thetvdb.com/?tab=series&id=" + json[i].tvdbId + ")]";
								count++;
							}
						}
					}
				}
			}

			if (count == 0) {
				return message.channel.send("No shows found on server matching that criteria.");
			}

			embed.setDescription(description);

			let sentMessage = await message.channel.send({embed});
			sentMessage.react(emojiOptions[0])
				.then(async () => {
					sentMessage.awaitReactions(filter, { time: 15000 })
						.then(async collected => {
							var selectedEmojis = [];
							collected.tap(selectedOptions => {
								if (selectedOptions.users.get(message.author.id) != undefined) {
									selectedEmojis.push(selectedOptions._emoji.name);
								}
							});

							if (selectedEmojis.length == 0) {
								embed = new Discord.RichEmbed()
									.setDescription("Nothing selected in time, nothing grouped.")
									.setTimestamp(new Date())
									.setColor(0x00AE86);
								return sentMessage.edit({embed});
							}
							else if (selectedEmojis.length == 1) {
								embed = new Discord.RichEmbed()
									.setDescription("Nothing grouped up! A minimum of 2 shows need to be selected!")
									.setTimestamp(new Date())
									.setColor(0x00AE86);
								return sentMessage.edit({embed});
							}

              let newRole = await message.guild.roles.find(role => role.name === groupName);
							if (newRole) {
								let tvShowsNotificationSettings;
								var setDescription = "";

								for (let emojis of selectedEmojis) {
									tvShowsNotificationSettings = client.getTvShowsNotificationSettings.get(showEmojiList[emojis]);

									if (tvShowsNotificationSettings.roleID != null || tvShowsNotificationSettings.roleID != undefined) {
										var oldRole = await message.guild.roles.find(role => role.id === tvShowsNotificationSettings.roleID);
										if (oldRole === null) {
											tvShowsNotificationSettings.is_group = "true";
											tvShowsNotificationSettings.groupName = groupName;
											tvShowsNotificationSettings.groupRole = newRole.id;
											tvShowsNotificationSettings.exclude = null;
											tvShowsNotificationSettings.include = null;
											tvShowsNotificationSettings.roleID = null;
											setDescription = setDescription + "\n > " + tvShowsNotificationSettings.title;
											client.setTvShowsNotificationSettings.run(tvShowsNotificationSettings);
											tvShowsNotificationSettings = client.getTvShowsNotificationSettings.get(showEmojiList[emojis]);
										}
										else {
											await message.guild.roles.find(role => role.id === tvShowsNotificationSettings.roleID).delete()
											  .then(async () => {
												  tvShowsNotificationSettings.is_group = "true";
												  tvShowsNotificationSettings.groupName = groupName;
												  tvShowsNotificationSettings.groupRole = newRole.id;
												  tvShowsNotificationSettings.exclude = null;
												  tvShowsNotificationSettings.include = null;
												  tvShowsNotificationSettings.roleID = null;
												  setDescription = setDescription + "\n > " + tvShowsNotificationSettings.title;
												  client.setTvShowsNotificationSettings.run(tvShowsNotificationSettings);
												  tvShowsNotificationSettings = client.getTvShowsNotificationSettings.get(showEmojiList[emojis]);
											  })
											  .catch(console.error);
										}
									}
									else {
										tvShowsNotificationSettings.is_group = "true";
										tvShowsNotificationSettings.groupName = groupName;
										tvShowsNotificationSettings.groupRole = newRole.id;
										tvShowsNotificationSettings.exclude = null;
										tvShowsNotificationSettings.include = null;
										tvShowsNotificationSettings.roleID = null;
										setDescription = setDescription + "\n > " + tvShowsNotificationSettings.title;
										client.setTvShowsNotificationSettings.run(tvShowsNotificationSettings);
										ttvShowsNotificationSettings = client.getTvShowsNotificationSettings.get(showEmojiList[emojis]);
									}
							}
							setDescription = "Successfully grouped up the following shows:" + setDescription;
							embed = new Discord.RichEmbed()
								.setDescription(setDescription)
								.setTimestamp(new Date())
								.setColor(0x00AE86);

							sentMessage.edit({embed});
							}
							if (!newRole) {
								newRole = await message.guild.createRole({
									name: groupName,
									color: 'BLUE',
									mentionable: true
								})
									.then(async role => {
										let tvShowsNotificationSettings;
										var setDescription = "";

										for (let emojis of selectedEmojis) {
											tvShowsNotificationSettings = client.getTvShowsNotificationSettings.get(showEmojiList[emojis]);

											if (tvShowsNotificationSettings.roleID != null || tvShowsNotificationSettings.roleID != undefined) {
												var oldRole = await message.guild.roles.find(role => role.id === tvShowsNotificationSettings.roleID);
												if (oldRole === null) {
													tvShowsNotificationSettings.is_group = "true";
													tvShowsNotificationSettings.groupName = groupName;
													tvShowsNotificationSettings.groupRole = role.id;
													tvShowsNotificationSettings.exclude = null;
													tvShowsNotificationSettings.include = null;
													tvShowsNotificationSettings.roleID = null;
													setDescription = setDescription + "\n > " + tvShowsNotificationSettings.title;
													client.setTvShowsNotificationSettings.run(tvShowsNotificationSettings);
													tvShowsNotificationSettings = client.getTvShowsNotificationSettings.get(showEmojiList[emojis]);
												}
												else {
													await message.guild.roles.find(role => role.id === tvShowsNotificationSettings.roleID).delete()
													  .then(async () => {
														  tvShowsNotificationSettings.is_group = "true";
														  tvShowsNotificationSettings.groupName = groupName;
														  tvShowsNotificationSettings.groupRole = role.id;
														  tvShowsNotificationSettings.exclude = null;
														  tvShowsNotificationSettings.include = null;
														  tvShowsNotificationSettings.roleID = null;
														  setDescription = setDescription + "\n > " + tvShowsNotificationSettings.title;
														  client.setTvShowsNotificationSettings.run(tvShowsNotificationSettings);
														  tvShowsNotificationSettings = client.getTvShowsNotificationSettings.get(showEmojiList[emojis]);
													  })
													  .catch(console.error);
												}
											}
											else {
												tvShowsNotificationSettings.is_group = "true";
												tvShowsNotificationSettings.groupName = groupName;
												tvShowsNotificationSettings.groupRole = role.id;
												tvShowsNotificationSettings.exclude = null;
												tvShowsNotificationSettings.include = null;
												tvShowsNotificationSettings.roleID = null;
												setDescription = setDescription + "\n > " + tvShowsNotificationSettings.title;
												client.setTvShowsNotificationSettings.run(tvShowsNotificationSettings);
												ttvShowsNotificationSettings = client.getTvShowsNotificationSettings.get(showEmojiList[emojis]);
											}
									}
									setDescription = "Successfully grouped up the following shows:" + setDescription;
									embed = new Discord.RichEmbed()
										.setDescription(setDescription)
										.setTimestamp(new Date())
										.setColor(0x00AE86);

									sentMessage.edit({embed});

									})
									.catch(console.error)
							}
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
    else if (command === "ungroup") {
      // Ungroup up Multiple Items
			var messageAfterCommand = message.content.slice(message.content.indexOf(command) + command.length + 1);
			if (message.content.length < message.content.indexOf(command) + command.length + 1) {
				return message.channel.send("You didn't state a name or shows to ungroup!");
			}

			var showNamesToSearch = [];
			if (messageAfterCommand.indexOf("[") === -1) return message.channel.send("You didn't state any shows to ungroup!");
			messageAfterCommand = messageAfterCommand.slice(messageAfterCommand.indexOf("["), messageAfterCommand.length).trim();
			var showCount = 0;
			var keepGoing =  true;

			while(keepGoing) {
				if (messageAfterCommand.indexOf("[") === -1) {
					keepGoing = false;
					break;
				}
				var show = messageAfterCommand.slice(messageAfterCommand.indexOf("[") + 1, messageAfterCommand.indexOf("]")).trim();
				messageAfterCommand = messageAfterCommand.slice(messageAfterCommand.indexOf("]") + 1, messageAfterCommand.length).trim();
				showNamesToSearch.push(show);
			}

			if (showNamesToSearch.length <= 1) {
				return message.channel.send("Invalid command format, nothing ungrouped!\nYou need to state at least 2 shows to ungroup in the format of " + prefix + ogCommand + " " + command + "[show1] [show2]");
			}

			var emojiOptions = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
			const filter = (reaction, user) => emojiOptions.indexOf(reaction.emoji.name) != -1;
			var setDescription = "";

			var findExemptEmbedReactRoles = false;
			for (let exemptNames of exemptEmbedReactRoles) {
				if(`Sonarr Show Lookup:` === exemptNames) findExemptEmbedReactRoles = true;
			}
			if (!findExemptEmbedReactRoles) exemptEmbedReactRoles.push(`Sonarr Show Lookup:`);
			embed = new Discord.RichEmbed()
				.setAuthor('Sonarr Show Lookup:') //don't foget to edit exemptEmbedReactRoles above if name changes so it is ignored in index.js role react
				.setTimestamp(new Date())
				.setColor(0x00AE86);

			//var json = await sonarr.sonarrService.lookUpSeries(showNamesToSearch[i]);
			var description = "Select the emojis that correspond to the shows you want to ungroup:\n";
			var count = 0;
			var showEmojiList = {};
			for (var j = 0; j < showNamesToSearch.length; j++) {
				var json = await sonarr.sonarrService.lookUpSeries(showNamesToSearch[j]);
				if (json == "error") {
					console.log("Couldn't connect to Sonarr, check your settings.");
					return message.channel.send("Couldn't connect to Sonarr, check your settings.");
				}
				for (var i = 0; i < json.length; i++) {
					if (count >= 9) break;
					for (const tvNotificationSettings of client.searchTvShowsNotificationSettings.iterate()) {
						if (tvNotificationSettings.thetvdb_id == json[i].tvdbId) {
							var isDuplicate = false;
							for (let x in showEmojiList) {
								if (showEmojiList[x] == `${json[i].cleanTitle}-${json[i].imdbId}-${message.guild.id}`) isDuplicate = true;
							}
							if (!isDuplicate) {
								tvShowsNotificationSettings = client.getTvShowsNotificationSettings.get(`${json[i].cleanTitle}-${json[i].imdbId}-${message.guild.id}`);
								if (tvShowsNotificationSettings.is_group == "true") {
									showEmojiList[emojiOptions[count]] = `${json[i].cleanTitle}-${json[i].imdbId}-${message.guild.id}`;
									description = description + "\n" + emojiOptions[count] + " " + json[i].title + " (" + json[i].year + ") " + "[[TheTVDb](http://thetvdb.com/?tab=series&id=" + json[i].tvdbId + ")]";
									count++;
								}
							}
						}
					}
				}
			}

			if (count == 0) {
				return message.channel.send("No shows found on server matching that criteria that are also already in a group.");
			}

			embed.setDescription(description);

			let sentMessage = await message.channel.send({embed});
			sentMessage.react(emojiOptions[0])
				.then(async () => {
					sentMessage.awaitReactions(filter, { time: 15000 })
						.then(async collected => {
							var selectedEmojis = [];
							collected.tap(selectedOptions => {
								if (selectedOptions.users.get(message.author.id) != undefined) {
									selectedEmojis.push(selectedOptions._emoji.name);
								}
							});

							if (selectedEmojis.length == 0) {
								embed = new Discord.RichEmbed()
									.setDescription("Nothing selected in time, nothing ungrouped.")
									.setTimestamp(new Date())
									.setColor(0x00AE86);
								return sentMessage.edit({embed});
							}
							else if (selectedEmojis.length == 1) {
								embed = new Discord.RichEmbed()
									.setDescription("Nothing ungrouped! A minimum of 2 shows need to be selected!")
									.setTimestamp(new Date())
									.setColor(0x00AE86);
								return sentMessage.edit({embed});
							}

							let tvShowsNotificationSettings;
							var setDescription = "";

							for (let emojis of selectedEmojis) {
								tvShowsNotificationSettings = client.getTvShowsNotificationSettings.get(showEmojiList[emojis]);

								var oldRole = tvShowsNotificationSettings.groupRole;
								var deleteRole = true;

								tvShowsNotificationSettings.is_group = null;
								tvShowsNotificationSettings.groupName = null;
								tvShowsNotificationSettings.groupRole = null;
								tvShowsNotificationSettings.exclude = null;
								tvShowsNotificationSettings.include = null;
								tvShowsNotificationSettings.roleID = null;
								setDescription = setDescription + "\n > " + tvShowsNotificationSettings.title;
								client.setTvShowsNotificationSettings.run(tvShowsNotificationSettings);
								tvShowsNotificationSettings = client.getTvShowsNotificationSettings.get(showEmojiList[emojis]);

								for (const tvNotificationSettings of client.searchTvShowsNotificationSettings.iterate()) {
									if (tvNotificationSettings.groupRole == oldRole) {
										deleteRole = false;
									}
								}
								if (deleteRole) {
									await message.guild.roles.find(role => role.id === oldRole).delete()
										.then(async () => {
										})
										.catch(console.error);
								}

								if (tvShowsNotificationSettings.status == "continuing") {
									// Create a new role with data
									var role = await message.guild.roles.find(role => role.name === tvShowsNotificationSettings.title);

									if (role) {
										tvShowsNotificationSettings.roleID = role.id;
										client.setTvShowsNotificationSettings.run(tvShowsNotificationSettings);
										tvShowsNotificationSettings = client.getTvShowsNotificationSettings.get(showEmojiList[emojis]);
									}
									else {
										tvShowsNotificationSettings = await client.getTvShowsNotificationSettings.get(showEmojiList[emojis]);
										let newRole = await message.guild.createRole({
											name: tvShowsNotificationSettings.title,
											color: 'BLUE',
											mentionable: true
										})
											.then(role => {
												tvShowsNotificationSettings.roleID = role.id;
												client.setTvShowsNotificationSettings.run(tvShowsNotificationSettings);
												tvShowsNotificationSettings = client.getTvShowsNotificationSettings.get(showEmojiList[emojis]);
											})
											.catch(console.error);
									}
								}
							}
						setDescription = "Successfully ungrouped the following shows:" + setDescription;
						embed = new Discord.RichEmbed()
							.setDescription(setDescription)
							.setTimestamp(new Date())
							.setColor(0x00AE86);

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
    else if (command === "list") {
      // List the items that have been manually added as well as currently airing
      if (!message.channel.guild.member(message.author).hasPermission('ADMINISTRATOR')) {
        return message.channel.send('You do not have permissions to use `' + prefix + ogCommand + " " + command + '`!');
      }
			const mainProgram = require("../index.js");
      await mainProgram.updateShowList(message);

      var tenNumbers = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

			var page1Description = "";
			var page1Count = 0;
			var addLine = false;

			for (const notificationSettings of client.searchNotificationSettings.iterate()) {
				if (notificationSettings.category === "custom" && (notificationSettings.roleID != null || notificationSettings.roleID != undefined)) {
					if (notificationSettings.id === `${message.guild.id}-${client.user.id}-${notificationSettings.roleID}`) {
						//Check to make sure client id is the same, in case using a different bot token
						addLine = true;
						page1Description = page1Description + `\n${tenNumbers[page1Count]} <@&${notificationSettings.roleID}> ${notificationSettings.description}`;
						page1Count++;
					}
				}
			}
			if (addLine) {
				addLine = false;
				page1Description = page1Description + `\n`;
			}
			for (const notificationSettings of client.searchNotificationSettings.iterate()) {
				if (notificationSettings.category === "movies" && (notificationSettings.roleID != null || notificationSettings.roleID != undefined)) {
					if (notificationSettings.id === `${message.guild.id}-${client.user.id}-${notificationSettings.name}`) {
						//Check to make sure client id is the same, in case using a different bot token
						addLine = true;
						page1Description = page1Description + `\n${tenNumbers[page1Count]} <@&${notificationSettings.roleID}> ${notificationSettings.description}`;
						page1Count++;
					}
				}
			}
			if (addLine) {
				addLine = false;
				page1Description = page1Description + `\n`;
			}
			for (const notificationSettings of client.searchNotificationSettings.iterate()) {
				if (notificationSettings.category === "tv" && (notificationSettings.roleID != null || notificationSettings.roleID != undefined)) {
					if (notificationSettings.id === `${message.guild.id}-${client.user.id}-${notificationSettings.name}`) {
						//Check to make sure client id is the same, in case using a different bot token
						page1Description = page1Description + `\n${tenNumbers[page1Count]} <@&${notificationSettings.roleID}> ${notificationSettings.description}`;
						page1Count++;
					}
				}
			}

			embed = new Discord.RichEmbed()
				.setAuthor('Choose what Groups you would like to be notified for:')
				.setDescription(page1Description)
				.setColor(0x00AE86);

      if (page1Count >= 1) {
				let page1SentMessage = await message.channel.send({embed});
				page1SentMessage.react(tenNumbers[0])
					.then(async () => { if (page1Count > 1) await page1SentMessage.react(tenNumbers[1]) })
					.then(async () => { if (page1Count > 2) await page1SentMessage.react(tenNumbers[2]) })
					.then(async () => { if (page1Count > 3) await page1SentMessage.react(tenNumbers[3]) })
					.then(async () => { if (page1Count > 4) await page1SentMessage.react(tenNumbers[4]) })
					.then(async () => { if (page1Count > 5) await page1SentMessage.react(tenNumbers[5]) })
					.then(async () => { if (page1Count > 6) await page1SentMessage.react(tenNumbers[6]) })
					.then(async () => { if (page1Count > 7) await page1SentMessage.react(tenNumbers[7]) })
					.then(async () => { if (page1Count > 8) await page1SentMessage.react(tenNumbers[8]) })
					.then(async () => { if (page1Count > 9) await page1SentMessage.react(tenNumbers[9]) })
					.catch(() => console.error('One of the emojis failed to react.'));
			}

			var page2Description = "";
			var page2Count = 0;

			for (const notificationSettings of client.searchNotificationSettings.iterate()) {
				if (notificationSettings.category === "networks" && (notificationSettings.roleID != null || notificationSettings.roleID != undefined)) {
					if (notificationSettings.id === `${message.guild.id}-${client.user.id}-${notificationSettings.name}`) {
						//Check to make sure client id is the same, in case using a different bot token
						page2Description = page2Description + `\n${tenNumbers[page2Count]} <@&${notificationSettings.roleID}> ${notificationSettings.description}`;
						page2Count++;
					}
				}
			}

			embed = new Discord.RichEmbed()
				.setAuthor('Choose what TV Networks you would like to be notified for:')
				.setDescription(page2Description)
				.setColor(0x00AE86);

      if (page2Count >= 1) {
				let page2SentMessage = await message.channel.send({embed});
				page2SentMessage.react(tenNumbers[0])
					.then(async () => { if (page2Count > 1) await page2SentMessage.react(tenNumbers[1]) })
					.then(async () => { if (page2Count > 2) await page2SentMessage.react(tenNumbers[2]) })
					.then(async () => { if (page2Count > 3) await page2SentMessage.react(tenNumbers[3]) })
					.then(async () => { if (page2Count > 4) await page2SentMessage.react(tenNumbers[4]) })
					.then(async () => { if (page2Count > 5) await page2SentMessage.react(tenNumbers[5]) })
					.then(async () => { if (page2Count > 6) await page2SentMessage.react(tenNumbers[6]) })
					.then(async () => { if (page2Count > 7) await page2SentMessage.react(tenNumbers[7]) })
					.then(async () => { if (page2Count > 8) await page2SentMessage.react(tenNumbers[8]) })
					.then(async () => { if (page2Count > 9) await page2SentMessage.react(tenNumbers[9]) })
					.catch(() => console.error('One of the emojis failed to react.'));
			}


      var showsList = [];
      var sortList = [];
      var count = 0;
      for (const notificationQuery of client.searchTvShowsNotificationSettings.iterate()) {
        if (notificationQuery.guild === message.guild.id && notificationQuery.exclude === null && (notificationQuery.roleID != null || notificationQuery.groupRole != null)) {
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
      sortList = await sortList.sort();

      for (var i = 0; i < sortList.length; i++) {
        notificationSettings = client.getTvShowsNotificationSettingsBySortTitle.get(sortList[i]);
        if (!notificationSettings) {
          // GroupName
          notificationSettings = client.getTvShowsNotificationSettingsByGroupName.get(sortList[i]);
          var role = message.guild.roles.find(role => role.id === notificationSettings.groupRole);
          if (role != null) {
            showsList[i] = role;
						showsList[i] = showsList[i] + " <- Grouped Show";
          }
          else {
            showsList[i] = notificationSettings.groupName;
						showsList[i] = showsList[i] + " <- Grouped Show";
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
