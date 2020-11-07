module.exports = {
	name: 'list',
  aliases: [],
	description: 'List Notification React Roles',
	usage: '',
	adminCommand: true,
	subcommands: {

	},
	async execute(message, args, prefix, guildSettings, client, Discord, config, fetch, exemptEmbedReactRoles, tautulli, sonarr, notificationSettings, args2, ogCommand, command) {
    // List the items that have been manually added as well as currently airing
    if (!message.channel.guild.member(message.author).hasPermission('ADMINISTRATOR')) {
      return message.channel.send('You do not have permissions to use `' + prefix + ogCommand + " " + command + '`!');
    }

		const updateShowList = require('../../../src/functions/updateShowList.js');
    await updateShowList(message, client);

		let processingPage = await message.channel.send("Preparing notification list...");
		guildSettings.listCreationActive = "on";
		client.setGuildSettings.run(guildSettings);
		guildSettings = client.getGuildSettings.get(message.guild.id);

		// Clear Previous Notifier List and Delete the old messages
		var previousNotifierList = [];
		for (let previousNotifierListObject of client.searchPreviousNotifierList.iterate()) {
      await previousNotifierList.push(previousNotifierListObject);
		}
		for (var i = 0; i < previousNotifierList.length; i++) {
			if (message.guild.id == previousNotifierList[i].guild) {
				// Check if previousNotifierList entry is in the same guild as the message that called the command.
				var channelsInGuild = client.guilds.cache.get(previousNotifierList[i].guild).channels.cache.array();
				for (let index = 0; index < channelsInGuild.length; index++) {
					if (channelsInGuild[index].type == "text") {
						//gets stuck inside the await from below...
		        await channelsInGuild[index].messages.fetch(`${previousNotifierList[i].messageID}`)
		          .then(async messageFromList => {
								// Delete a message
								let preserveredNotifierList = previousNotifierList[i]; // needed because the notifierList will sometimes change faster then it can process in the callback
								// Moved this to the .then block after message delete. This ensures its only cleared once it has deleted successfully
								//client.deletePreviousNotifier.run(`${preserveredNotifierList.id}`);  // Clear Previous Notifier
								messageFromList.delete()
									.then(msg => {
										client.deletePreviousNotifier.run(`${preserveredNotifierList.id}`);  // Clear Previous Notifier
										//let thisIsStupid = true; // I'm not really sure why (this didn't use to be an issue), but the catch block below won't work without a .then block and the .then also can't be empty.
									})
	  							.catch(() => {
										// List Creation failed. Reset database variable
										guildSettings.listCreationActive = "off";
										client.setGuildSettings.run(guildSettings);
										guildSettings = client.getGuildSettings.get(message.guild.id);
										console.error;
									});
		          })
		          .catch(function(error) {
		            if (error.code == 10008) {
		              //unknown message, therefore not the right channel, do not log this.
		            }
		            else {
									// List Creation failed. Reset database variable
									guildSettings.listCreationActive = "off";
									client.setGuildSettings.run(guildSettings);
									guildSettings = client.getGuildSettings.get(message.guild.id);

		              console.log(error);
		            }
		          });
		      }
	  		}
			}
	  }

		await client.clearRecentlyAddedShows.run(`${message.guild.id}`);  //clear clearRecentlyAddedShows list too
		await client.clearCustomReactRolePage.run(`${message.guild.id}`);  //clear clearCustomReactRolePage list too

		// Iterate through React Role List and set everything to true
		var userActiveCount = 0;
		var setInactiveUsersList = [];
    for (let inactiveUsersList of client.searchNewListInactiveUsers.iterate()) {
      inactiveUsersList.inactive = "true";
			await setInactiveUsersList.push(inactiveUsersList);
			//client.setNewListInactiveUsers.run(inactiveUsersList);  // I need to make an array and re-iterate to do changes, can not run on an open database
			userActiveCount++;
		}
		for (var i = 0; i < setInactiveUsersList.length; i++) {
			client.setNewListInactiveUsers.run(setInactiveUsersList[i]); // Clear Previous Notifier From Database
		}

		processingPage.delete()
			.then(msg => {
				//
			})
			.catch(() => {
				// List Creation failed. Reset database variable
				guildSettings.listCreationActive = "off";
				client.setGuildSettings.run(guildSettings);
				guildSettings = client.getGuildSettings.get(message.guild.id);
				console.error;
			});

		if (userActiveCount == 0) {
			// Presumably first time !n list is called since no one is in the database
			const date = new Date();  // 2009-11-10
      const month = date.toLocaleString('default', { month: 'long' });
			const day = date.getDate();
			const year = date.getFullYear();
			const nth = function(d) {
        if (d > 3 && d < 21) return 'th';
        switch (d % 10) {
          case 1:  return "st";
          case 2:  return "nd";
          case 3:  return "rd";
          default: return "th";
        }
      }

			firstTimeEmbed = new Discord.MessageEmbed()
	      .setAuthor(`${client.newNotificationListAuthorName}`)
				.setTitle(`*Created on ${month} ${day}${nth(day)}, ${year}.*`)
	      .setDescription("Select any desired roles below to receive notifications.\n\nTo unsubscribe from all notifications, click the ❌ below.")
	      .setColor(0x00AE86);

			let newListWarningPage = await message.channel.send({embed: firstTimeEmbed});
			client.setPreviousNotifierList.run({ id: `${message.guild.id}-${client.user.id}-${newListWarningPage.id}`, guild: message.guild.id, messageID: newListWarningPage.id });
			newListWarningPage.react(`❌`);
		}
		else if (userActiveCount > 0) {
			//This is not the first time !n list has been called, people currently have roles
			const date = new Date();  // 2009-11-10
      const month = date.toLocaleString('default', { month: 'long' });
			const day = date.getDate();
			const year = date.getFullYear();
			const nth = function(d) {
        if (d > 3 && d < 21) return 'th';
        switch (d % 10) {
          case 1:  return "st";
          case 2:  return "nd";
          case 3:  return "rd";
          default: return "th";
        }
      }

			warningEmbed = new Discord.MessageEmbed()
	      .setAuthor(`${client.newNotificationListAuthorName}`)
				.setTitle(`*Updated on ${month} ${day}${nth(day)}, ${year}.*`)
	      .setDescription("Re-add any desired roles below, otherwise we will use your roles from the previous list.\n\nTo unsubscribe from all notifications, click the ❌ below.")
	      .setColor(0x00AE86);

			let newListWarningPage = await message.channel.send({embed: warningEmbed});
			client.setPreviousNotifierList.run({ id: `${message.guild.id}-${client.user.id}-${newListWarningPage.id}`, guild: message.guild.id, messageID: newListWarningPage.id });
			newListWarningPage.react(`❌`);
		}

    var tenNumbers = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

		var customPageDescription = "";
    var customPageCount = 0;

    for (const notificationSettings of client.searchNotificationSettings.iterate()) {
      if (notificationSettings.category === "custom" && (notificationSettings.roleID != null || notificationSettings.roleID != undefined)) {
        if (notificationSettings.id === `${message.guild.id}-${client.user.id}-${notificationSettings.roleID}`) {
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
      let customPageSentMessage = await message.channel.send({embed});
      client.setPreviousNotifierList.run({ id: `${message.guild.id}-${client.user.id}-${customPageSentMessage.id}`, guild: message.guild.id, messageID: customPageSentMessage.id });
			client.setNewCustomReactRolePage.run({ id: `${message.guild.id}-${client.user.id}-${message.channel.id}-${customPageSentMessage.id}`, guild: message.guild.id, channelID: message.channel.id, messageID: customPageSentMessage.id, roleCount: customPageCount });
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
				.catch(() => {
					// List Creation failed. Reset database variable
					guildSettings.listCreationActive = "off";
					client.setGuildSettings.run(guildSettings);
					guildSettings = client.getGuildSettings.get(message.guild.id);
					console.error('One of the emojis failed to react.');
				});
    }

    var page1Description = "";
    var page1Count = 0;
    var addLine = false;

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

    embed = new Discord.MessageEmbed()
      .setAuthor('Choose what Groups you would like to be notified for:')
      .setDescription(page1Description)
      .setColor(0x00AE86);

    if (page1Count >= 1) {
      let page1SentMessage = await message.channel.send({embed});
      client.setPreviousNotifierList.run({ id: `${message.guild.id}-${client.user.id}-${page1SentMessage.id}`, guild: message.guild.id, messageID: page1SentMessage.id });
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
				.catch(() => {
					// List Creation failed. Reset database variable
					guildSettings.listCreationActive = "off";
					client.setGuildSettings.run(guildSettings);
					guildSettings = client.getGuildSettings.get(message.guild.id);
					console.error('One of the emojis failed to react.');
				});
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

    embed = new Discord.MessageEmbed()
      .setAuthor('Choose what TV Networks you would like to be notified for:')
      .setDescription(page2Description)
      .setColor(0x00AE86);

    if (page2Count >= 1) {
      let page2SentMessage = await message.channel.send({embed});
      client.setPreviousNotifierList.run({ id: `${message.guild.id}-${client.user.id}-${page2SentMessage.id}`, guild: message.guild.id, messageID: page2SentMessage.id });
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
				.catch(() => {
					// List Creation failed. Reset database variable
					guildSettings.listCreationActive = "off";
					client.setGuildSettings.run(guildSettings);
					guildSettings = client.getGuildSettings.get(message.guild.id);
					console.error('One of the emojis failed to react.');
				});
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
		sortList = await sortList.sort(function (a, b) {
      return a.localeCompare(b, 'en', {'sensitivity': 'base'});
    });

    for (var i = 0; i < sortList.length; i++) {
      notificationSettings = "";
      for (const tempNotificationSetting of client.getTvShowsNotificationSettingsBySortTitle.all(sortList[i])) {
        if (tempNotificationSetting.guild == message.guild.id) {
          notificationSettings = tempNotificationSetting;
          break;
        }
      }

      if (!notificationSettings) {
        // GroupName
        notificationSettings = "";
        for (const tempNotificationSetting of client.getTvShowsNotificationSettingsByGroupName.all(sortList[i])) {
          if (tempNotificationSetting.guild == message.guild.id) {
            notificationSettings = tempNotificationSetting;
            break;
          }
        }
        var role = message.guild.roles.cache.find(role => role.id === notificationSettings.groupRole);
        if (role != null) {
          showsList[i] = `| <@&${role.id}> | Grouped Show`;
        }
        else {
          showsList[i] = "| " + notificationSettings.groupName + " | Grouped Show";
        }
      }
      else {
        var role = message.guild.roles.cache.find(role => role.id === notificationSettings.roleID);
        if (role != null) {
					if (notificationSettings.thetvdb_id != null && notificationSettings.thetvdb_id != undefined && notificationSettings.thetvdb_id != "") {
						var url = `https://www.thetvdb.com/?id=${notificationSettings.thetvdb_id}&tab=series`;
						showsList[i] = `| <@&${role.id}> | [About](${url})`;
					}
					else if (notificationSettings.imdbID_or_themoviedbID != null && notificationSettings.imdbID_or_themoviedbID != undefined && notificationSettings.imdbID_or_themoviedbID != "") {
						var url = `https://www.imdb.com/title/${notificationSettings.imdbID_or_themoviedbID}`;
						showsList[i] = `| <@&${role.id}> | [About](${url})`;
					}
					else {
						showsList[i] = `<@&${role.id}>`;
					}
        }
        else {
          showsList[i] = notificationSettings.title;
        }
      }
    }

    var total = showsList.length;
    for (var pages = 0; (pages*10) < total; pages++) {
      embed = new Discord.MessageEmbed()
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
      client.setPreviousNotifierList.run({ id: `${message.guild.id}-${client.user.id}-${emojiTime.id}`, guild: message.guild.id, messageID: emojiTime.id });
      for (var i = 0; i < emojiCount; i++) {
        await emojiTime.react(tenNumbers[i])
          .then()
					.catch(() => {
						// List Creation failed. Reset database variable
						guildSettings.listCreationActive = "off";
						client.setGuildSettings.run(guildSettings);
						guildSettings = client.getGuildSettings.get(message.guild.id);
						console.error;
					});
      }
    }

		// List Creation is complete
		guildSettings.listCreationActive = "off";
		await client.setGuildSettings.run(guildSettings);    //await here to insure emoji events gets the new guildSettings before we call updateReactRolesWhileOffline.
		guildSettings = client.getGuildSettings.get(message.guild.id);

		// we must call updateReactRolesWhileOffline() after list creation because if someone clicked a react role during list creation, it was skipped
		const updateReactRolesWhileOffline = require('../../../src/functions/updateReactRolesWhileOffline.js');
		updateReactRolesWhileOffline(false, false, true);
  },
};
