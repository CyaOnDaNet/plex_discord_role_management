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
	async execute(message, args, prefix, guildSettings, client, Discord, tautulli) {
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
			embed = new Discord.RichEmbed()
				.setAuthor('Notification Role-Mention Options:') //don't foget to edit index.js role react to ignore this if name changes
				.addField('\u200b', `The following options are currently disabled but can be enabled now:`)
				.setTimestamp(new Date())
				.setColor(0x00AE86);

			let sentMessage = await message.channel.send({embed});
			sentMessage.react(emojiOptions[0])
			  .then(() => {
					sentMessage.awaitReactions(filter, { time: 15000 })
				    .then(collected => {
							var selectedEmojis = [];
							//console.log(`Collected ${collected.size} reactions`)
							collected.tap(selectedOptions => {
								if (selectedOptions.users.get(message.author.id) != undefined) {
									console.log(selectedOptions._emoji.name);
									selectedEmojis.push(selectedOptions._emoji.name);
								}
							});
							var returnMessage = "You selected: ";
							for(let emojis of selectedEmojis) {
	    						returnMessage += emojis + " ";
							}
							//console.log(selectedEmojis);
							embed = new Discord.RichEmbed()
								.setDescription(returnMessage)
								.setTimestamp(new Date())
								.setColor(0x00AE86);

							sentMessage.edit({embed});
						})
				    .catch(console.error);
			  })
				.then(() => sentMessage.react(emojiOptions[1]))
				.then(() => sentMessage.react(emojiOptions[2]))
				.then(() => sentMessage.react(emojiOptions[3]))
				.then(() => sentMessage.react(emojiOptions[4]))
				.then(() => sentMessage.react(emojiOptions[5]))
				.then(() => sentMessage.react(emojiOptions[6]))
				.then(() => sentMessage.react(emojiOptions[7]))
				.then(() => sentMessage.react(emojiOptions[8]))
				.then(() => sentMessage.react(emojiOptions[9]))
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
							if (guildSettings.customRoleCount + 1 >= 6) {
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
						embed = new Discord.RichEmbed()
							.setAuthor('Custom React Role Removal:') //don't foget to edit index.js role react to ignore this if name changes
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
						  .then(() => {
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
							.then(() => { if (count > 1) sentMessage.react(emojiOptions[1]) })
							.then(() => { if (count > 2) sentMessage.react(emojiOptions[2]) })
							.then(() => { if (count > 3) sentMessage.react(emojiOptions[3]) })
							.then(() => { if (count > 4) sentMessage.react(emojiOptions[4]) })
							.then(() => { if (count > 5) sentMessage.react(emojiOptions[5]) })
							.then(() => { if (count > 6) sentMessage.react(emojiOptions[6]) })
							.then(() => { if (count > 7) sentMessage.react(emojiOptions[7]) })
							.then(() => { if (count > 8) sentMessage.react(emojiOptions[8]) })
							.then(() => { if (count > 9) sentMessage.react(emojiOptions[9]) })
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
