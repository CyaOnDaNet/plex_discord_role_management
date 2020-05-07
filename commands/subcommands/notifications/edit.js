module.exports = {
	name: 'edit',
  aliases: [],
	description: 'Notification Settings to Edit',
	usage: '',
	adminCommand: true,
	subcommands: {

	},
	async execute(message, args, prefix, guildSettings, client, Discord, config, fetch, exemptEmbedReactRoles, tautulli, sonarr, notificationSettings, args2, ogCommand, command) {
    //enables certain notification options
    var emojiOptions = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
    const filter = (reaction, user) => emojiOptions.indexOf(reaction.emoji.name) != -1;

    exemptEmbedReactRoles.push(`Notification Role-Mention Options:`);
    var setDescription = "";
    embed = new Discord.MessageEmbed()
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
    var roleLimitHit = false;
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

        if (notificationSettings.id === `${message.guild.id}-${client.user.id}-${notificationSettings.name}`) {
          //Check to make sure client id is the same, in case using a different bot token
          count++;
        }
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
            collected.each(selectedOptions => {
              if (selectedOptions.users.cache.get(message.author.id) != undefined) {
                selectedEmojis.push(selectedOptions._emoji.name);
              }
            });

            var successfullyDisabledItems = "";
            var successfullyEnabledItems = "";
            embed = new Discord.MessageEmbed()
              .setTimestamp(new Date())
              .setColor(0x00AE86);

            var count2 = 0;
            for(let emojis of selectedEmojis) {
              let notificationSettings = client.getNotificationSettings.get(sortedEmojiList[emojis]);
              //console.log(notificationSettings.name);

              if(notificationSettings.roleID != null) {
                //delete role and remove from database
                if (await message.guild.roles.cache.find(role => role.id === notificationSettings.roleID) != null) {
                  await message.guild.roles.cache.find(role => role.id === notificationSettings.roleID).delete()
                    .then(async () => {
                      notificationSettings.roleID = null;
                      client.setNotificationSettings.run(notificationSettings);
                      notificationSettings = client.getNotificationSettings.get(sortedEmojiList[emojis]);

                      successfullyDisabledItems = await successfullyDisabledItems + `\n > **${notificationSettings.name}** ${notificationSettings.description}`;
                    })
                    .catch(console.error);
                }
                else {
                  notificationSettings.roleID = null;
                  client.setNotificationSettings.run(notificationSettings);
                  notificationSettings = client.getNotificationSettings.get(sortedEmojiList[emojis]);

                  successfullyDisabledItems = await successfullyDisabledItems + `\n > **${notificationSettings.name}** ${notificationSettings.description}`;
                }
              }
              else {
                // Create role and store in database
                var role = await message.guild.roles.cache.find(role => role.name === notificationSettings.name);

                if (role) {
                  notificationSettings.roleID = role.id;
                  client.setNotificationSettings.run(notificationSettings);
                  notificationSettings = client.getNotificationSettings.get(sortedEmojiList[emojis]);
                }
                else {
                  let newRole = await message.guild.roles.create({
                    data: {
                      name: notificationSettings.name,
                      color: 'GREEN',
                      mentionable: true
                    }
                  })
                    .then(async role => {
                      notificationSettings.roleID = role.id;
                      client.setNotificationSettings.run(notificationSettings);
                      notificationSettings = client.getNotificationSettings.get(sortedEmojiList[emojis]);

                      successfullyEnabledItems = await successfullyEnabledItems + `\n > <@&${notificationSettings.roleID}> ${notificationSettings.description}`;
                    })
                    .catch(function(error) {
                      count2--;
                      if (error.code == 30005) {
                        //Max Role Count on Server Hit
                        if (!roleLimitHit) {
                          console.log(error);
                        }
                        roleLimitHit = true;
                      }
                      else {
                        console.log(error);
                      }
                    });
                }
              }
              count2++;
            }

            if (count2 <= 0) {
              if (roleLimitHit) {
                embed = new Discord.MessageEmbed()
                  .setDescription("**Action Failed!**\nDiscord Role Limit Hit!\nPlease delete some roles and try again.")
                  .setTimestamp(new Date())
                  .setColor(0x00AE86);
              }
              else {
                embed = new Discord.MessageEmbed()
                  .setDescription("Nothing selected in time, nothing edited.")
                  .setTimestamp(new Date())
                  .setColor(0x00AE86);
              }
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
              if (roleLimitHit) {
                embed.addField("\u200b", "***Note:*** Some Roles could not be created due to hitting the discord limit!");
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

    var networksSetDescription = "";
    exemptEmbedReactRoles.push(`TV Network Options:`);
    embed2 = new Discord.MessageEmbed()
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
        if (notificationSettings.id === `${message.guild.id}-${client.user.id}-${notificationSettings.name}`) {
          //Check to make sure client id is the same, in case using a different bot token
          networksCount++;
        }
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
            collected.each(selectedOptions => {
              if (selectedOptions.users.cache.get(message.author.id) != undefined) {
                selectedEmojis.push(selectedOptions._emoji.name);
              }
            });

            var successfullyDisabledItems = "";
            var successfullyEnabledItems = "";
            embed2 = new Discord.MessageEmbed()
              .setTimestamp(new Date())
              .setColor(0x00AE86);

            var count2 = 0;
            var roleLimitHit2 = false;
            for(let emojis of selectedEmojis) {
              let notificationSettings = client.getNotificationSettings.get(networksSortedEmojiList[emojis]);
              //console.log(notificationSettings.name);

              if(notificationSettings.roleID != null) {
                //delete role and remove from database
                if (await message.guild.roles.cache.find(role => role.id === notificationSettings.roleID) != null) {
                  await message.guild.roles.cache.find(role => role.id === notificationSettings.roleID).delete()
                    .then(async () => {
                      notificationSettings.roleID = null;
                      client.setNotificationSettings.run(notificationSettings);
                      notificationSettings = client.getNotificationSettings.get(networksSortedEmojiList[emojis]);

                      successfullyDisabledItems = await successfullyDisabledItems + `\n > **${notificationSettings.name}** ${notificationSettings.description}`;
                    })
                    .catch(console.error);
                }
                else {
                  notificationSettings.roleID = null;
                  client.setNotificationSettings.run(notificationSettings);
                  notificationSettings = client.getNotificationSettings.get(networksSortedEmojiList[emojis]);

                  successfullyDisabledItems = await successfullyDisabledItems + `\n > **${notificationSettings.name}** ${notificationSettings.description}`;
                }
              }
              else {
                // Create role and store in database
                var role = await message.guild.roles.cache.find(role => role.name === notificationSettings.name);

                if (role) {
                  notificationSettings.roleID = role.id;
                  client.setNotificationSettings.run(notificationSettings);
                  notificationSettings = client.getNotificationSettings.get(networksSortedEmojiList[emojis]);
                }
                else {
                  let newRole = await message.guild.roles.create({
                    data: {
                      name: notificationSettings.name,
                      color: 'GREEN',
                      mentionable: true
                    }
                  })
                    .then(async role => {
                      notificationSettings.roleID = role.id;
                      client.setNotificationSettings.run(notificationSettings);
                      notificationSettings = client.getNotificationSettings.get(networksSortedEmojiList[emojis]);

                      successfullyEnabledItems = await successfullyEnabledItems + `\n > <@&${notificationSettings.roleID}> ${notificationSettings.description}`;
                    })
                    .catch(function(error) {
                      count2--;
                      if (error.code == 30005) {
                        //Max Role Count on Server Hit
                        if (!roleLimitHit2) {
                          console.log(error);
                        }
                        roleLimitHit2 = true;
                      }
                      else {
                        console.log(error);
                      }
                    });
                }
              }
              count2++;
            }

            if (count2 <= 0) {
              if (roleLimitHit2) {
                embed2 = new Discord.MessageEmbed()
                  .setDescription("**Action Failed!**\nDiscord Role Limit Hit!\nPlease delete some roles and try again.")
                  .setTimestamp(new Date())
                  .setColor(0x00AE86);
              }
              else {
                embed2 = new Discord.MessageEmbed()
                  .setDescription("Nothing selected in time, nothing edited.")
                  .setTimestamp(new Date())
                  .setColor(0x00AE86);
              }
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
              if (roleLimitHit2) {
                embed2.addField("\u200b", "***Note:*** Some Roles could not be created due to hitting the discord limit!");
              }
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
  },
};
