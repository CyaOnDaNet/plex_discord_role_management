var customReactRoleLimit = 10;
module.exports = {
	name: 'custom',
  aliases: [],
	description: 'Custom Notification React Roles',
	usage: '',
	adminCommand: true,
	subcommands: {
		'add':'@mentionedRole Optional Description',
		'remove':'',
	},
	async execute(message, args, prefix, guildSettings, client, Discord, config, fetch, exemptEmbedReactRoles, tautulli, sonarr, notificationSettings, args2, ogCommand, command) {
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
            if (guildSettings.customRoleCount + 1 > customReactRoleLimit) {
              return message.channel.send(`You have hit the custom react role limit of ${customReactRoleLimit}, please remove a custom react role to add a new one.`);
            }
            else {
              var description = '';
              let notificationSettings;

              description = message.content.slice(message.content.indexOf(">") + 1, message.content.length).trim();

              notificationSettings = { id: `${message.guild.id}-${client.user.id}-${mentionedRole.id}`, guild: message.guild.id, name: `Custom-${mentionedRole.id}`, category: `custom`, description: description, roleID: mentionedRole.id };
              client.setNotificationSettings.run(notificationSettings);
							notificationSettings = client.getNotificationSettings.get(`${message.guild.id}-${client.user.id}-${mentionedRole.id}`);

              guildSettings.customRoleCount = guildSettings.customRoleCount + 1;
              client.setGuildSettings.run(guildSettings);
              guildSettings = client.getGuildSettings.get(message.guild.id);


							// Gather embed history
							var tenNumbers = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
							var customReactRoleID = "";
							var channelID = "";
							var messageID = "";
							var roleCount = "";
				      for (const customReactRolePage of client.searchCustomReactRolePage.iterate()) {
				        if (customReactRolePage.guild == message.guild.id) {
									customReactRoleID = customReactRolePage.id;
									channelID = customReactRolePage.channelID;
									messageID = customReactRolePage.messageID;
									roleCount = customReactRolePage.roleCount;
				        }
				      }

							if (customReactRoleID == "" || channelID == "" || messageID == "" || roleCount == "") {
								// Role React Page hasn't been created so nothing needs to be edited. We do need to create the custom page though.

								var previousNotifierList = [];
								for (let previousNotifierListObject of client.searchPreviousNotifierList.iterate()) {
									await previousNotifierList.push(previousNotifierListObject);
								}
								var sentAlready = false;
								for (var i = 0; i < previousNotifierList.length; i++) {
									if (message.guild.id == previousNotifierList[i].guild) {
										// Check if previousNotifierList entry is in the same guild as the message that caled the command.
										var channelsWithRole = client.guilds.cache.get(previousNotifierList[i].guild).channels.cache.array();
										for (let index = 0; index < channelsWithRole.length; index++) {
											if (channelsWithRole[index].type == "text") {
								        await channelsWithRole[index].messages.fetch(`${previousNotifierList[i].messageID}`)
								          .then(async messageWithList => {
														// Now that we know the channel, send the embed
														if (!sentAlready) {
															index = channelsWithRole.length + 1;
															sentAlready = true;
															let channelID = messageWithList.channel.id;

															var customPageDescription = "";
													    var customPageCount = 0;

													    for (const notificationSettings of client.searchNotificationSettings.iterate()) {
													      if (notificationSettings.category === "custom" && (notificationSettings.roleID != null || notificationSettings.roleID != undefined)) {
													        if (notificationSettings.id === `${messageWithList.guild.id}-${client.user.id}-${notificationSettings.roleID}`) {
													          //Check to make sure client id is the same, in case using a different bot token
													          customPageDescription = customPageDescription + `\n${tenNumbers[customPageCount]} <@&${notificationSettings.roleID}> ${notificationSettings.description}`;
													          customPageCount++;
													        }
													      }
													    }

															embed = new Discord.MessageEmbed()
													      .setAuthor('Choose which custom roles you want:')
													      .setDescription(customPageDescription)
													      .setColor(0x00AE86);

													    if (customPageCount >= 1) {
													      let customPageSentMessage = await messageWithList.guild.channels.resolve(channelID).send({embed});
													      //let customPageSentMessage = await messageWithList.guild.channels.cache.get(channelID).send({embed});
													      client.setPreviousNotifierList.run({ id: `${messageWithList.guild.id}-${client.user.id}-${customPageSentMessage.id}`, guild: messageWithList.guild.id, messageID: customPageSentMessage.id });
																client.setNewCustomReactRolePage.run({ id: `${messageWithList.guild.id}-${client.user.id}-${messageWithList.channel.id}-${customPageSentMessage.id}`, guild: messageWithList.guild.id, channelID: messageWithList.channel.id, messageID: customPageSentMessage.id, roleCount: customPageCount });
													      customPageSentMessage.react(tenNumbers[0])
													        .then(async () => { if (customPageCount > 1) await customPageSentMessage.react(tenNumbers[1]) })
													        .then(async () => { if (customPageCount > 2) await customPageSentMessage.react(tenNumbers[2]) })
													        .then(async () => { if (customPageCount > 3) await customPageSentMessage.react(tenNumbers[3]) })
													        .then(async () => { if (customPageCount > 4) await customPageSentMessage.react(tenNumbers[4]) })
													        .then(async () => { if (customPageCount > 5) await customPageSentMessage.react(tenNumbers[5]) })
													        .then(async () => { if (customPageCount > 6) await customPageSentMessage.react(tenNumbers[6]) })
													        .then(async () => { if (customPageCount > 7) await customPageSentMessage.react(tenNumbers[7]) })
													        .then(async () => { if (customPageCount > 8) await customPageSentMessage.react(tenNumbers[8]) })
													        .then(async () => { if (customPageCount > 9) await customPageSentMessage.react(tenNumbers[9]) })
													        .catch(() => console.error('One of the emojis failed to react.'));
													    }
														}
								          })
								          .catch(function(error) {
								            if (error.code == 10008) {
								              //unknown message, therefore not the right channel, do not log this.
								            }
								            else {
								              console.log(error);
								            }
								          });
								      }
							  		}
									}
							  }
							}
							else {
								//get embed
								let customReactRolePageSettings = client.getCustomReactRolePage.get(customReactRoleID);
								customReactRolePageSettings.roleCount = guildSettings.customRoleCount;
								client.setNewCustomReactRolePage.run(customReactRolePageSettings);
								customReactRolePageSettings = client.getCustomReactRolePage.get(customReactRoleID);
								roleCount = customReactRolePageSettings.roleCount;

				        var messageEMBED = await client.guilds.cache.get(message.guild.id).channels.resolve(channelID).messages.resolve(messageID);
								var description = messageEMBED.embeds[0].description;

								var splitDescription = description.split(/\r?\n/);
								var usedEmojis = [
									['1️⃣', ''],
									['2️⃣', ''],
									['3️⃣', ''],
									['4️⃣', ''],
									['5️⃣', ''],
									['6️⃣', ''],
									['7️⃣', ''],
									['8️⃣', ''],
									['9️⃣', ''],
									['🔟', ''],
								];

								for (let i = 0; i < splitDescription.length; i++) {
									for (let emoji = 0; emoji < tenNumbers.length; emoji++) {
										if (splitDescription[i].indexOf(tenNumbers[emoji]) != -1) {
											usedEmojis[emoji][1] = splitDescription[i];
										}
									}
								}

								var emojiRemoval = [];
								for (let emoji = 0; emoji < tenNumbers.length; emoji++) {
									if (usedEmojis[emoji][1] === "" || usedEmojis[emoji][1] === undefined || usedEmojis[emoji][1] === null) {
										usedEmojis[emoji][1] = `${usedEmojis[emoji][0]} <@&${notificationSettings.roleID}> ${notificationSettings.description}`; //store it here
										break;
									}
								}

								var newDescription = "";
								for (let emoji = 0; emoji < tenNumbers.length; emoji++) {
									if (usedEmojis[emoji][1] != "" && usedEmojis[emoji][1] != undefined && usedEmojis[emoji][1] != null) {
										newDescription = newDescription + "\n" + usedEmojis[emoji][1];
									}
								}

				        customReactRoleEmbed = new Discord.MessageEmbed()
				  	      .setAuthor(`${messageEMBED.embeds[0].author.name}`)
				  	      .setDescription(newDescription)
				  	      .setColor(0x00AE86);

								let customReactRoleEmbedMessage = await messageEMBED.edit({embed: customReactRoleEmbed}).catch(console.error);
								if (usedEmojis[0][1] != "" && usedEmojis[0][1] != undefined && usedEmojis[0][1] != null) await customReactRoleEmbedMessage.react(tenNumbers[0]).catch(() => console.error('One of the emojis failed to react.'));
								if (usedEmojis[1][1] != "" && usedEmojis[1][1] != undefined && usedEmojis[1][1] != null) await customReactRoleEmbedMessage.react(tenNumbers[1]).catch(() => console.error('One of the emojis failed to react.'));
								if (usedEmojis[2][1] != "" && usedEmojis[2][1] != undefined && usedEmojis[2][1] != null) await customReactRoleEmbedMessage.react(tenNumbers[2]).catch(() => console.error('One of the emojis failed to react.'));
								if (usedEmojis[3][1] != "" && usedEmojis[3][1] != undefined && usedEmojis[3][1] != null) await customReactRoleEmbedMessage.react(tenNumbers[3]).catch(() => console.error('One of the emojis failed to react.'));
								if (usedEmojis[4][1] != "" && usedEmojis[4][1] != undefined && usedEmojis[4][1] != null) await customReactRoleEmbedMessage.react(tenNumbers[4]).catch(() => console.error('One of the emojis failed to react.'));
								if (usedEmojis[5][1] != "" && usedEmojis[5][1] != undefined && usedEmojis[5][1] != null) await customReactRoleEmbedMessage.react(tenNumbers[5]).catch(() => console.error('One of the emojis failed to react.'));
								if (usedEmojis[6][1] != "" && usedEmojis[6][1] != undefined && usedEmojis[6][1] != null) await customReactRoleEmbedMessage.react(tenNumbers[6]).catch(() => console.error('One of the emojis failed to react.'));
								if (usedEmojis[7][1] != "" && usedEmojis[7][1] != undefined && usedEmojis[7][1] != null) await customReactRoleEmbedMessage.react(tenNumbers[7]).catch(() => console.error('One of the emojis failed to react.'));
								if (usedEmojis[8][1] != "" && usedEmojis[8][1] != undefined && usedEmojis[8][1] != null) await customReactRoleEmbedMessage.react(tenNumbers[8]).catch(() => console.error('One of the emojis failed to react.'));
								if (usedEmojis[9][1] != "" && usedEmojis[9][1] != undefined && usedEmojis[9][1] != null) await customReactRoleEmbedMessage.react(tenNumbers[9]).catch(() => console.error('One of the emojis failed to react.'));
							}

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

          var setDescription = "The following custom react roles can be removed:\n";
          exemptEmbedReactRoles.push(`Custom React Role Removal:`);
          embed = new Discord.MessageEmbed()
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
                .then(async collected => {
                  var selectedEmojis = [];
                  collected.each(selectedOptions => {
                    if (selectedOptions.users.cache.get(message.author.id) != undefined) {
                      selectedEmojis.push(selectedOptions._emoji.name);
                    }
                  });
                  var setDescription = "Successfully removed the following Custom React Roles:\n(*Don't forget to delete the role in Discord, I don't manage custom roles!*)\n";
                  embed = new Discord.MessageEmbed()
                    .setTimestamp(new Date())
                    .setColor(0x00AE86);

                  var count2 = 0;
									var deleteEmojisByRole = [];
                  for(let emojis of selectedEmojis) {
										deleteEmojisByRole.push(`${customList[emojis]}`);
                    client.deleteNotificationSettings.run(`${message.guild.id}-${client.user.id}-${customList[emojis]}`);    // delete a row based on id
                    guildSettings.customRoleCount = guildSettings.customRoleCount - 1;
                    client.setGuildSettings.run(guildSettings);
                    guildSettings = client.getGuildSettings.get(message.guild.id);

                    setDescription = setDescription + "\n" + `${customList2[emojis]}`;
                    count2++;
                  }

                  if (count2 === 0) {
                    embed = new Discord.MessageEmbed()
                      .setDescription("Nothing selected in time, no custom React Roles were removed.")
                      .setTimestamp(new Date())
                      .setColor(0x00AE86);
                  }
                  else {
                    embed.setDescription(setDescription);

										// Gather embed history to edit existing role react embed
										var tenNumbers = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
										var customReactRoleID = "";
										var channelID = "";
										var messageID = "";
										var roleCount = "";
							      for (const customReactRolePage of client.searchCustomReactRolePage.iterate()) {
							        if (customReactRolePage.guild == message.guild.id) {
												customReactRoleID = customReactRolePage.id;
												channelID = customReactRolePage.channelID;
												messageID = customReactRolePage.messageID;
												roleCount = customReactRolePage.roleCount;
							        }
							      }

										if (customReactRoleID == "" || channelID == "" || messageID == "" || roleCount == "") {
											// Role React Page hasn't been created so nothing needs to be edited
										}
										else {
											//get embed
											let customReactRolePageSettings = client.getCustomReactRolePage.get(customReactRoleID);
											customReactRolePageSettings.roleCount = guildSettings.customRoleCount;
											client.setNewCustomReactRolePage.run(customReactRolePageSettings);
											customReactRolePageSettings = client.getCustomReactRolePage.get(customReactRoleID);
											roleCount = customReactRolePageSettings.roleCount;

							        var messageEMBED = await client.guilds.cache.get(message.guild.id).channels.resolve(channelID).messages.resolve(messageID);
										  var description = messageEMBED.embeds[0].description;

											var splitDescription = description.split(/\r?\n/);
											var usedEmojis = [
												['1️⃣', ''],
												['2️⃣', ''],
												['3️⃣', ''],
												['4️⃣', ''],
												['5️⃣', ''],
												['6️⃣', ''],
												['7️⃣', ''],
												['8️⃣', ''],
												['9️⃣', ''],
												['🔟', ''],
											];

											for (let i = 0; i < splitDescription.length; i++) {
												for (let emoji = 0; emoji < tenNumbers.length; emoji++) {
													if (splitDescription[i].indexOf(tenNumbers[emoji]) != -1) {
														usedEmojis[emoji][1] = splitDescription[i];
													}
												}
											}

											var emojiRemoval = [];
											for (let emoji = 0; emoji < tenNumbers.length; emoji++) {
												for (let j = 0; j < deleteEmojisByRole.length; j++) {
													if (usedEmojis[emoji][1].indexOf(`<@&${deleteEmojisByRole[j]}>`) != -1) {
														//found a role to remove
														let emojiRemovalToPush = {};
														emojiRemovalToPush.emoji = `${usedEmojis[emoji][0]}`;
														emojiRemovalToPush.emojiRoleID = `${deleteEmojisByRole[j]}`;
														await emojiRemoval.push(emojiRemovalToPush);
														usedEmojis[emoji][1] = '';
													}
												}
											}

											var newDescription = "";
											for (let emoji = 0; emoji < tenNumbers.length; emoji++) {
												if (usedEmojis[emoji][1] != "" && usedEmojis[emoji][1] != undefined && usedEmojis[emoji][1] != null) {
													newDescription = newDescription + "\n" + usedEmojis[emoji][1];
												}
											}

											var tmpCustomRoleCount = 0;
											for (const notificationSettings of client.searchNotificationSettings.iterate()) {
									      if (notificationSettings.category === "custom" && (notificationSettings.roleID != null || notificationSettings.roleID != undefined)) {
									        if (notificationSettings.id === `${message.guild.id}-${client.user.id}-${notificationSettings.roleID}`) {
									          //Check to make sure client id is the same, in case using a different bot token
									          tmpCustomRoleCount++;
									        }
									      }
									    }

							        customReactRoleEmbed = new Discord.MessageEmbed()
							  	      .setAuthor(`${messageEMBED.embeds[0].author.name}`)
							  	      .setDescription(newDescription)
							  	      .setColor(0x00AE86);

							        let customReactRoleEmbedMessage = await messageEMBED.edit({embed: customReactRoleEmbed}).catch(console.error);
											if (usedEmojis[0][1] != "" && usedEmojis[0][1] != undefined && usedEmojis[0][1] != null) await customReactRoleEmbedMessage.react(tenNumbers[0]).catch(() => console.error('One of the emojis failed to react.'));
											if (usedEmojis[1][1] != "" && usedEmojis[1][1] != undefined && usedEmojis[1][1] != null) await customReactRoleEmbedMessage.react(tenNumbers[1]).catch(() => console.error('One of the emojis failed to react.'));
											if (usedEmojis[2][1] != "" && usedEmojis[2][1] != undefined && usedEmojis[2][1] != null) await customReactRoleEmbedMessage.react(tenNumbers[2]).catch(() => console.error('One of the emojis failed to react.'));
											if (usedEmojis[3][1] != "" && usedEmojis[3][1] != undefined && usedEmojis[3][1] != null) await customReactRoleEmbedMessage.react(tenNumbers[3]).catch(() => console.error('One of the emojis failed to react.'));
											if (usedEmojis[4][1] != "" && usedEmojis[4][1] != undefined && usedEmojis[4][1] != null) await customReactRoleEmbedMessage.react(tenNumbers[4]).catch(() => console.error('One of the emojis failed to react.'));
											if (usedEmojis[5][1] != "" && usedEmojis[5][1] != undefined && usedEmojis[5][1] != null) await customReactRoleEmbedMessage.react(tenNumbers[5]).catch(() => console.error('One of the emojis failed to react.'));
											if (usedEmojis[6][1] != "" && usedEmojis[6][1] != undefined && usedEmojis[6][1] != null) await customReactRoleEmbedMessage.react(tenNumbers[6]).catch(() => console.error('One of the emojis failed to react.'));
											if (usedEmojis[7][1] != "" && usedEmojis[7][1] != undefined && usedEmojis[7][1] != null) await customReactRoleEmbedMessage.react(tenNumbers[7]).catch(() => console.error('One of the emojis failed to react.'));
											if (usedEmojis[8][1] != "" && usedEmojis[8][1] != undefined && usedEmojis[8][1] != null) await customReactRoleEmbedMessage.react(tenNumbers[8]).catch(() => console.error('One of the emojis failed to react.'));
											if (usedEmojis[9][1] != "" && usedEmojis[9][1] != undefined && usedEmojis[9][1] != null) await customReactRoleEmbedMessage.react(tenNumbers[9]).catch(() => console.error('One of the emojis failed to react.'));

											for (let i = 0; i < emojiRemoval.length; i++) {
												// remove the reaction
												let roleEmojiToRemoveFromUser = emojiRemoval[i].emoji;
												let roleIDToRemoveFromUser = emojiRemoval[i].emojiRoleID;
												let reactionUsers = await messageEMBED.reactions.resolve(`${roleEmojiToRemoveFromUser}`).users.cache.array(); //array of users with reaction
												let roleMembers = await messageEMBED.guild.roles.cache.get(`${roleIDToRemoveFromUser}`).members.array(); //array of members with role corresponding to the reaction

												//iterate through both arrays, if user is present in both, then remove the role from the user.
												for (let userIndex = 0; userIndex < reactionUsers.length; userIndex++) {
													for (let memberIndex = 0; memberIndex < roleMembers.length; memberIndex++) {
														if (reactionUsers[userIndex].id == roleMembers[memberIndex].id) {
															// remove role here
															await roleMembers[memberIndex].roles.remove(`${roleIDToRemoveFromUser}`, `Removed role from user because they got it from the custom react role page which was just removed.`);
														}
													}
												}
												messageEMBED.reactions.resolve(`${emojiRemoval[i].emoji}`).remove(); // finally, remove the reaction from the embed
											}
										}
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
          return message.channel.send('Invalid use of `' + prefix + ogCommand + ' custom`, please try again.');
        }
      }
      else {
        return message.channel.send('You do not have permissions to use `' + prefix + ogCommand + ' custom` in <#' + message.channel.id + '>!');
      }
    } else {

			var customPageDescription = "";

	    for (const notificationSettings of client.searchNotificationSettings.iterate()) {
	      if (notificationSettings.category === "custom" && (notificationSettings.roleID != null || notificationSettings.roleID != undefined)) {
	        if (notificationSettings.id === `${message.guild.id}-${client.user.id}-${notificationSettings.roleID}`) {
	          //Check to make sure client id is the same, in case using a different bot token
	          customPageDescription = customPageDescription + `\n <@&${notificationSettings.roleID}> ${notificationSettings.description}`;
	        }
	      }
	    }

			if (customPageDescription == "") {
				customPageDescription = `You are in charge of creating/deleting the roles. To use this command, type: \`${prefix}${ogCommand} custom add @role Optional description of role\` or type: \`${prefix}${ogCommand} custom remove\``;
			}
			else {
				customPageDescription = `You are in charge of creating/deleting the roles. To use this command, type: \`${prefix}${ogCommand} custom add @role Optional description of role\` or type: \`${prefix}${ogCommand} custom remove\`\n\nA list of currently enabled custom roles are below:${customPageDescription}`;
			}

			embed = new Discord.MessageEmbed()
	      .setAuthor('This command enables/disables custom react roles.')
	      .setDescription(customPageDescription)
	      .setColor(0x00AE86);

			return message.channel.send({embed});
    }
  },
};
