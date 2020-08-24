module.exports = async(data) => {
  // Processes Tautulli webhooks
	//console.log(`Hook incoming: "${data.trigger}"`);

  const Discord = require('discord.js');
  const mainProgram = require("../../index.js");
  const client = mainProgram.client;
  var sonarr = mainProgram.sonarr;
  var undefinedStreamers = mainProgram.undefinedStreamers;

  async function prepUpdateEmbed(guildID, tvShowsNotificationSettings, roleLimitHit, data, existsInDatabase, roleExists, guildSettings) {
    if (roleLimitHit) {
      // Discord Server Role Limit was hit and role creation failed. Continue on without updating embed.
      console.log("\"Recently Added Show\" triggered but failed to create role. Discord role limit hit, skipping role creation and embed update.");
      finishShowHook(data, existsInDatabase, guildID, roleExists, guildSettings);
    }
    else {
      // Gather embed history
      var pageJSON = {};
      var recentlyAddedShowsList = [];
      for (const recentlyAddedShows of client.searchRecentlyAddedShows.iterate()) {
        if (recentlyAddedShows.guild == guildID) {
          let recentlyAddedShowEntry = {
            'id' : `${recentlyAddedShows.id}`,
            'guild' : `${recentlyAddedShows.guild}`,
            'channelID' : `${recentlyAddedShows.channelID}`,
            'messageID' : `${recentlyAddedShows.messageID}`,
            'pageNumber' : `${recentlyAddedShows.pageNumber}`,
            'emojiNumber' : `${recentlyAddedShows.emojiNumber}`
          }
          recentlyAddedShowsList.push(recentlyAddedShowEntry);

          let pageNumber = Number(recentlyAddedShows.pageNumber);
          let emojiCount = [];
          emojiCount.push(Number(recentlyAddedShows.emojiNumber));

          if (!pageJSON[`${pageNumber}`]) {
            pageJSON[`${pageNumber}`] = emojiCount;
          }
          else {
            //page is already in the JSON object, add emojiCount to the array.
            let tmpEmojiCount = pageJSON[`${pageNumber}`];
            tmpEmojiCount.push(Number(recentlyAddedShows.emojiNumber));
            tmpEmojiCount.sort((a, b) => a - b);
            pageJSON[`${pageNumber}`] = tmpEmojiCount;
          }
        }
      }

      // Gather next emoji slot info
      var freeSlots = [];
      var currentPageNumber = 0;
  		var currentEmojiNumber = 0;

  		Object.keys(pageJSON).forEach(function(key) {
  			var emojiCheck = {
          '1' : {
            'pageNumber' : `${key}`,
            'filled' : false
          },
          '2' : {
  					'pageNumber' : `${key}`,
            'filled' : false
          },
  				'3' : {
            'pageNumber' : `${key}`,
            'filled' : false
          },
  				'4' : {
            'pageNumber' : `${key}`,
            'filled' : false
          },
  				'5' : {
            'pageNumber' : `${key}`,
            'filled' : false
          },
  				'6' : {
            'pageNumber' : `${key}`,
            'filled' : false
          },
  				'7' : {
            'pageNumber' : `${key}`,
            'filled' : false
          },
  				'8' : {
            'pageNumber' : `${key}`,
            'filled' : false
          },
  				'9' : {
            'pageNumber' : `${key}`,
            'filled' : false
          },
  				'10' : {
            'pageNumber' : `${key}`,
            'filled' : false
          }
        };

  			if (key > currentPageNumber) {
  				currentPageNumber = key;
  				currentEmojiNumber = 0;
  			}

  			for (let emojiNumber in emojiCheck) {
  				if (pageJSON[key].indexOf(Number(emojiNumber)) != -1) {
  					currentEmojiNumber = emojiNumber;
  					emojiCheck[`${emojiNumber}`].filled = true;
  				}
  				else {
  					let availableEmoji = {
  						'emojiNumber' : `${emojiNumber}`,
  						'pageNumber' : `${key}`,
  						'filled' : false
  					}
  					freeSlots.push(availableEmoji);
  				}
  			}
      });

      // Figure out where show info gets inserted into embed
      var newPage = false;
      var guild = guildID;
      var channelID = 0;
      var messageID = 0;

      for (let j = 0; j < recentlyAddedShowsList.length; j++) {
        if (Number(recentlyAddedShowsList[j].pageNumber) == Number(currentPageNumber) && Number(recentlyAddedShowsList[j].emojiNumber) == Number(currentEmojiNumber)) {
          channelID = recentlyAddedShowsList[j].channelID;
          messageID = recentlyAddedShowsList[j].messageID;
        }
      }

      if (currentPageNumber == 0 && currentEmojiNumber == 0) {
        newPage = true;
        currentPageNumber++;
        currentEmojiNumber++;
      }
      else if (currentEmojiNumber == 10) {
        newPage = true;
        currentPageNumber++;
      	currentEmojiNumber = 1;
      }
      else {
      	currentEmojiNumber++;
      }

      if (channelID == 0) {
        // must get channelID from previousNotifierList
        var previousNotifierList = [];
        for (let previousNotifierListObject of client.searchPreviousNotifierList.iterate()) {
          await previousNotifierList.push(previousNotifierListObject);
        }
        var channelFound = false;
        for (let x = 0; x < previousNotifierList.length; x++) {
          if (previousNotifierList[x].guild == guildID) {
            if (!channelFound) {
              channelFound = true; // prevent duplicates
              var channelsWithRole = client.guilds.cache.get(previousNotifierList[x].guild).channels.cache.array();
              channelsWithRole.forEach(function(channel) {
                if (channel.type == "text") {
                  channel.messages.fetch(`${previousNotifierList[x].messageID}`)
                    .then(async message => {
                      // found the channelID from previousNotifierList
                      channelID = channel.id;
                      updateEmbed(tvShowsNotificationSettings, guildID, currentPageNumber, currentEmojiNumber, channelID, messageID, newPage, data, existsInDatabase, roleExists, guildSettings);
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
              });
            }
          }
        }
      }
      else {
        updateEmbed(tvShowsNotificationSettings, guildID, currentPageNumber, currentEmojiNumber, channelID, messageID, newPage, data, existsInDatabase, roleExists, guildSettings);
      }
      //extracted
    }
  }

  async function updateEmbed(tvShowsNotificationSettings, guildID, currentPageNumber, currentEmojiNumber, channelID, messageID, newPage, data, existsInDatabase, roleExists, guildSettings) {
    // recentlyAddedBoolean is on and show is currently airing. Role created and info stored in database. Embed history gathered and next emoji slot known.
    // We must now create or update recently added embed, repeat initial loop and continue on finishing the hook.

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
    var tenNumbers = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
    var showEntry = "";

    if (tvShowsNotificationSettings.thetvdb_id != null && tvShowsNotificationSettings.thetvdb_id != undefined && tvShowsNotificationSettings.thetvdb_id != "") {
      var url = `https://www.thetvdb.com/?id=${tvShowsNotificationSettings.thetvdb_id}&tab=series`;
      showEntry = `${tenNumbers[currentEmojiNumber-1]} | <@&${tvShowsNotificationSettings.roleID}> | [About](${url}) | *Added ${month} ${day}${nth(day)}, ${year}.*`;
    }
    else if (tvShowsNotificationSettings.imdbID_or_themoviedbID != null && tvShowsNotificationSettings.imdbID_or_themoviedbID != undefined && tvShowsNotificationSettings.imdbID_or_themoviedbID != "") {
      var url = `https://www.imdb.com/title/${tvShowsNotificationSettings.imdbID_or_themoviedbID}`;
      showEntry = `${tenNumbers[currentEmojiNumber-1]} | <@&${tvShowsNotificationSettings.roleID}> | [About](${url}) | *Added ${month} ${day}${nth(day)}, ${year}.*`;
    }
    else {
      showEntry = `${tenNumbers[currentEmojiNumber-1]} | <@&${tvShowsNotificationSettings.roleID}> | *Added ${month} ${day}${nth(day)}, ${year}.*`;
    }


    if (newPage) {
      // create embed
      var description = showEntry;
      recentlyAddedShowEmbed = new Discord.MessageEmbed()
	      .setAuthor(`Recently Added Shows`)
				.setTitle(`Page ${currentPageNumber}`)
	      .setDescription(description)
	      .setColor(0x00AE86);

      let recentlyAddedEmbedMessage = await client.guilds.cache.get(guildID).channels.resolve(channelID).send({embed: recentlyAddedShowEmbed}).catch(console.error);
      recentlyAddedEmbedMessage.react(tenNumbers[0])
        .then(async () => { if (currentEmojiNumber > 1) await recentlyAddedEmbedMessage.react(tenNumbers[1]) })
        .then(async () => { if (currentEmojiNumber > 2) await recentlyAddedEmbedMessage.react(tenNumbers[2]) })
        .then(async () => { if (currentEmojiNumber > 3) await recentlyAddedEmbedMessage.react(tenNumbers[3]) })
        .then(async () => { if (currentEmojiNumber > 4) await recentlyAddedEmbedMessage.react(tenNumbers[4]) })
        .then(async () => { if (currentEmojiNumber > 5) await recentlyAddedEmbedMessage.react(tenNumbers[5]) })
        .then(async () => { if (currentEmojiNumber > 6) await recentlyAddedEmbedMessage.react(tenNumbers[6]) })
        .then(async () => { if (currentEmojiNumber > 7) await recentlyAddedEmbedMessage.react(tenNumbers[7]) })
        .then(async () => { if (currentEmojiNumber > 8) await recentlyAddedEmbedMessage.react(tenNumbers[8]) })
        .then(async () => { if (currentEmojiNumber > 9) await recentlyAddedEmbedMessage.react(tenNumbers[9]) })
        .catch(() => console.error('One of the emojis failed to react.'));

      // Add to NotifierList table in database, allows for emoji watching over reboots as well as deleteing messages during clearing
      client.setPreviousNotifierList.run({ id: `${recentlyAddedEmbedMessage.guild.id}-${client.user.id}-${recentlyAddedEmbedMessage.id}`, guild: recentlyAddedEmbedMessage.guild.id, messageID: recentlyAddedEmbedMessage.id });
      // Add to NewRecentlyAddedShows table
      client.setNewRecentlyAddedShows.run({ id: `${recentlyAddedEmbedMessage.guild.id}-${client.user.id}-${channelID}-${recentlyAddedEmbedMessage.id}-${currentPageNumber}-${currentEmojiNumber}`, guild: recentlyAddedEmbedMessage.guild.id, channelID: channelID, messageID: recentlyAddedEmbedMessage.id, pageNumber: currentPageNumber, emojiNumber: currentEmojiNumber});
    }
    else {
      if (messageID == 0) {
        // Something went wrong. Should have had a value for message ID but for some reason did not.
        console.log("\"Recently Added Show\" triggered but something went wrong. Should have had a value for previous message ID but for some reason did not. Skipping embed update.");
        finishShowHook(data, existsInDatabase, guildID, roleExists, guildSettings);
      } else {
        //get embed
        var message = client.guilds.cache.get(guildID).channels.resolve(channelID).messages.resolve(messageID);
        var description = "" + message.embeds[0].description + "\n" + showEntry;
        recentlyAddedShowEmbed = new Discord.MessageEmbed()
  	      .setAuthor(`${message.embeds[0].author.name}`)
  				.setTitle(`${message.embeds[0].title}`)
  	      .setDescription(description)
  	      .setColor(0x00AE86);

        let recentlyAddedEmbedMessage = await message.edit({embed: recentlyAddedShowEmbed}).catch(console.error);
        recentlyAddedEmbedMessage.react(tenNumbers[0])
          .then(async () => { if (currentEmojiNumber > 1) await recentlyAddedEmbedMessage.react(tenNumbers[1]) })
          .then(async () => { if (currentEmojiNumber > 2) await recentlyAddedEmbedMessage.react(tenNumbers[2]) })
          .then(async () => { if (currentEmojiNumber > 3) await recentlyAddedEmbedMessage.react(tenNumbers[3]) })
          .then(async () => { if (currentEmojiNumber > 4) await recentlyAddedEmbedMessage.react(tenNumbers[4]) })
          .then(async () => { if (currentEmojiNumber > 5) await recentlyAddedEmbedMessage.react(tenNumbers[5]) })
          .then(async () => { if (currentEmojiNumber > 6) await recentlyAddedEmbedMessage.react(tenNumbers[6]) })
          .then(async () => { if (currentEmojiNumber > 7) await recentlyAddedEmbedMessage.react(tenNumbers[7]) })
          .then(async () => { if (currentEmojiNumber > 8) await recentlyAddedEmbedMessage.react(tenNumbers[8]) })
          .then(async () => { if (currentEmojiNumber > 9) await recentlyAddedEmbedMessage.react(tenNumbers[9]) })
          .catch(() => console.error('One of the emojis failed to react.'));

        // Add to NewRecentlyAddedShows table
        client.setNewRecentlyAddedShows.run({ id: `${recentlyAddedEmbedMessage.guild.id}-${client.user.id}-${channelID}-${messageID}-${currentPageNumber}-${currentEmojiNumber}`, guild: recentlyAddedEmbedMessage.guild.id, channelID: channelID, messageID: messageID, pageNumber: currentPageNumber, emojiNumber: currentEmojiNumber});

      }
    }

    // Recently added embed was created or updated. Now we must repeat initial loop and continue on finishing the hook.
    for (const showNotification of client.searchTvShowsNotificationSettings.iterate()) {
      if (showNotification.title === data.show_name || showNotification.thetvdb_id === data.thetvdb_id || showNotification.imdbID_or_themoviedbID === data.imdb_id) {
        existsInDatabase = true;
        guildID = showNotification.guild;
        if (showNotification.groupRole != null && showNotification.groupRole != undefined && showNotification.groupRole != "") {
          roleExists = showNotification.groupRole;
        }
        else {
          roleExists = showNotification.roleID;
        }
        if (roleExists && roleExists != "") {
          roleExists = "<@&" + roleExists + ">";
        }
      }
    }

    finishShowHook(data, existsInDatabase, guildID, roleExists, guildSettings);
  }

  async function finishShowHook(data, existsInDatabase, guildID, roleExists, guildSettings) {
    var showsByIMDB = data.imdb_id;
    var showsByTHETVDB = data.thetvdb_id;
    var showNetwork = "";
    if (existsInDatabase && showsByIMDB != "" && showsByIMDB != null && showsByIMDB != undefined) {
      showNetwork = client.getTvShowsByIMDB.get(showsByIMDB).network;
    }
    if (showNetwork === "" || showNetwork === null || showNetwork === undefined) {
      if (showsByTHETVDB != "" && showsByTHETVDB != null && showsByTHETVDB != undefined) {
        if (!existsInDatabase) {
          var json;
          for (let sonarrInstance in sonarr) {
            var tempJSON = await sonarr[sonarrInstance].lookUpSeries(`tvdb:${showsByTHETVDB}`);
            if (tempJSON == "error") {
              return console.log("Couldn't connect to Sonarr, check your settings.");
            }
            else {
              if (json === "" || json === null || json === undefined) json = tempJSON;
              else json = json.concat(tempJSON);  // join all sonarr instace results together
            }
          }
          // Let's remove any duplicate shows that are on multiple sonarr instances
          var tempJSON = [];
          for (var i = 0; i < json.length; i++) {
            var found = false;
            for (var j = 0; j < tempJSON.length; j++) {
              if (tempJSON[j].title == json[i].title && tempJSON[j].tvdbId == json[i].tvdbId && tempJSON[j].imdbId == json[i].imdbId) {
                found = true;
                break;
              }
            }
            if (!found) {
              tempJSON.push(json[i]);
            }
          }
          json = tempJSON;
          for (var i = 0; i < json.length; i++) {
            if (showsByTHETVDB == json[i].tvdbId) {
              showNetwork = json[i].network;
            }
          }
        } else {
          showNetwork = client.getTvShowsByTHETVDB.get(showsByTHETVDB).network;
        }
      }
    }

    for (const notificationSettings of client.searchNotificationSettings.iterate()) {
      if (notificationSettings.category === "tv") {
        if (notificationSettings.name === "All TV Episodes" && (notificationSettings.roleID != null || notificationSettings.roleID != undefined)) {
          if (roleExists && roleExists != "") {
            roleExists = roleExists + ", <@&" + notificationSettings.roleID + ">";
          } else {
            roleExists = "<@&" + notificationSettings.roleID + ">";
          }
        }
        if (notificationSettings.name === "New TV Shows" && (notificationSettings.roleID != null || notificationSettings.roleID != undefined)) {
          //check if season 1 episode 1
          var newShow = false;
          if (data.season_episode === "S01E01") newShow = true;
          if (data.newOverride == "01-yes") newShow = true;
          if (newShow === true) {
            if (roleExists && roleExists != "") {
              roleExists = roleExists + ", <@&" + notificationSettings.roleID + ">";
            } else {
              roleExists = "<@&" + notificationSettings.roleID + ">";
            }
          }
        }
      }

      if (notificationSettings.category === "networks") {
        if (showNetwork != "") {
          if (showNetwork.toLowerCase().indexOf(notificationSettings.name.toLowerCase()) != -1 && (notificationSettings.roleID != null || notificationSettings.roleID != undefined)) {
            if (roleExists && roleExists != "") {
              roleExists = roleExists + ", <@&" + notificationSettings.roleID + ">";
            } else {
              roleExists = "<@&" + notificationSettings.roleID + ">";
            }
          }
        }
      }
    }

    if (!guildID || guildID === "") {
      // show is not in database
      guildID = guildSettings.guild;
    }

    // form embed and send
    embed = new Discord.MessageEmbed()
      .setTitle(`${data.title}`)
      .setURL(`${data.plex_url}`)
      .setDescription(`${data.summary}`)
      .setThumbnail(`${data.poster_url}`)
      .addField('View Details', `[Plex Web](${data.plex_url})`)
      .setTimestamp(new Date())
      .setColor(0x00AE86);
    var messageBody = data.messageContent + "\n" + roleExists;
    client.guilds.cache.get(guildID).channels.resolve(guildSettings.notificationChannel).send(messageBody, {embed}).catch(console.error);
  }

  if (data.trigger === 'playbackStopped') {
    var plexName = data.user;
    let userList;
    userList = client.getLinkByPlexUserName.get(`${plexName}`);
    if (userList === undefined) {
      plexName = data.username;
      userList = client.getLinkByPlexUserName.get(`${plexName}`);
    }
    else {
      for (let userList of client.getLinkByPlexUserName.all(`${plexName}`)) {
        // This is where we remove the watching role
        let userToModify = client.guilds.cache.get(userList.guild).members.resolve(userList.discordUserID);
        let guildSettings = client.getGuildSettings.get(userList.guild);
        var bypass = true;

        if (userToModify === undefined) {
    			// User no longer exists in the Discord Server, we can't modify it at all so skip over them
    			continue;
    		}
        var roles = userToModify._roles;

        for (var i = 0; i < roles.length; i++) {
          if (roles[i] === guildSettings.watchingRole) {
            bypass = false;
          }
        }

        if (!Boolean(bypass)) {
          userList.watching = "false";
          client.setUserList.run(userList);
          var tmpID = userList.id;
          userList = client.getLinkByID.get(tmpID);

          await userToModify.roles.remove(guildSettings.watchingRole)
            .catch(console.error);
        }

        if (guildSettings.logChannelBoolean === "on") {
          var channelOption = 0;
          if (client.guilds.cache.get(userList.guild).channels.resolve(guildSettings.logChannel) === undefined) {
            // Channel is invalid
            console.log("Invalid logging channel detected, please re-apply logchannel command.");
            return;
          } else {
            channelOption = 1;
          }
          if (client.guilds.cache.get(userList.guild).channels.cache.find(channel => channel.name === guildSettings.logChannel) === null && channelOption === 0) {
            // Channel is invalid
            console.log("Invalid logging channel detected, please re-apply logchannel command.");
            return;
          }
          if (!Boolean(bypass) && channelOption === 1) {
            client.guilds.cache.get(userList.guild).channels.resolve(guildSettings.logChannel).send("Watching role successfully removed for **" + userToModify.user.username + "**!");
          } else if (!Boolean(bypass)) {
            client.guilds.cache.get(userList.guild).channels.cache.find(channel => channel.name === guildSettings.logChannel).send("Watching role successfully removed for **" + userToModify.user.username + "**!");
          }
        }
      }
    }
    if (userList === undefined) {
      // No record of plex username exists in database; therefore it has not been setup and we do nothing.
      if (undefinedStreamers.indexOf(plexName) === -1) {
        // prevents logs from filling up with duplicate entries
        console.log("Unlinked active streamer detected: " + `${plexName}`);
        undefinedStreamers.push(plexName);
      }
    }
    else {
      for (let userList of client.getLinkByPlexUserName.all(`${plexName}`)) {
        // This is where we remove the watching role
        let userToModify = client.guilds.cache.get(userList.guild).members.resolve(userList.discordUserID);
        let guildSettings = client.getGuildSettings.get(userList.guild);
        var bypass = true;

        if (userToModify === undefined) {
    			// User no longer exists in the Discord Server, we can't modify it at all so skip over them
    			continue;
    		}
        var roles = userToModify._roles;

        for (var i = 0; i < roles.length; i++) {
          if (roles[i] === guildSettings.watchingRole) {
            bypass = false;
          }
        }

        if (!Boolean(bypass)) {
          userList.watching = "false";
          client.setUserList.run(userList);
          var tmpID = userList.id;
          userList = client.getLinkByID.get(tmpID);

          userToModify.roles.remove(guildSettings.watchingRole)
            .catch(console.error);
        }

        if (guildSettings.logChannelBoolean === "on") {
          var channelOption = 0;
          if (client.guilds.cache.get(userList.guild).channels.resolve(guildSettings.logChannel) === undefined) {
            // Channel is invalid
            console.log("Invalid logging channel detected, please re-apply logchannel command.");
            return;
          } else {
            channelOption = 1;
          }
          if (client.guilds.cache.get(userList.guild).channels.cache.find(channel => channel.name === guildSettings.logChannel) === null && channelOption === 0) {
            // Channel is invalid
            console.log("Invalid logging channel detected, please re-apply logchannel command.");
            return;
          }
          if (!Boolean(bypass) && channelOption === 1) {
            client.guilds.cache.get(userList.guild).channels.resolve(guildSettings.logChannel).send("Watching role successfully removed for **" + userToModify.user.username + "**!");
          } else if (!Boolean(bypass)) {
            client.guilds.cache.get(userList.guild).channels.cache.find(channel => channel.name === guildSettings.logChannel).send("Watching role successfully removed for **" + userToModify.user.username + "**!");
          }
        }
      }
    }

		mainProgram.updateNumberOfActiveUsers(); // Update numberOfActiveUsers variable with proper Stream Count
  }

  else if (data.trigger === 'playbackStarted') {
    let userList;
    var plexName = data.user;
    userList = client.getLinkByPlexUserName.get(`${plexName}`);
    if (userList === undefined) {
      plexName = data.username;
      userList = client.getLinkByPlexUserName.get(`${plexName}`);
    }
    else {
      for (let userList of client.getLinkByPlexUserName.all(`${plexName}`)) {
        // This is where we assign the watching role
        let guildSettings = client.getGuildSettings.get(userList.guild);
        userList.watching = "true";
        client.setUserList.run(userList);
        var tmpID = userList.id;
        userList = client.getLinkByID.get(tmpID);

        let userToModify = client.guilds.cache.get(userList.guild).members.resolve(userList.discordUserID);
        var bypass = false;

        if (userToModify === undefined) {
    			// User no longer exists in the Discord Server, we can't modify it at all so skip over them
    			continue;
    		}
        var roles = userToModify._roles;

        for (var y = 0; y < roles.length; y++) {
          if (roles[y] === guildSettings.watchingRole) {
            bypass = true;
          }
        }

        var roleOption = 0;
        if (client.guilds.cache.get(userList.guild).roles.fetch(guildSettings.watchingRole) === undefined) {
          // Role is invalid
          console.log("Invalid watching role detected, please re-apply role command.");
          return;
        } else {
          roleOption = 1;
        }

        if (client.guilds.cache.get(userList.guild).roles.cache.find(role => role.name === guildSettings.watchingRole) === null && roleOption === 0) {
          // Role is invalid
          console.log("Invalid watching role detected, please re-apply role command.");
          return;
        }

        if (!Boolean(bypass)) {
          await userToModify.roles.add(guildSettings.watchingRole)
            .catch(console.error);
        }

        if (guildSettings.logChannelBoolean === "on") {
          var sendOption = 0;
          if (client.guilds.cache.get(userList.guild).channels.resolve(guildSettings.logChannel) === undefined) {
            // Channel is invalid
            console.log("Invalid logging channel detected, please re-apply logchannel command.");
            return;
          } else {
            sendOption = 1;
          }
          if (client.guilds.cache.get(userList.guild).channels.cache.find(channel => channel.name === guildSettings.logChannel) === null && sendOption === 0) {
            // Channel is invalid
            console.log("Invalid logging channel detected, please re-apply logchannel command.");
            return;
          }
          if (!Boolean(bypass) && sendOption === 1) {
            client.guilds.cache.get(userList.guild).channels.resolve(guildSettings.logChannel).send("Watching role successfully added for **" + userToModify.user.username + "**!");
          } else if (!Boolean(bypass)) {
            client.guilds.cache.get(userList.guild).channels.cache.find(channel => channel.name === guildSettings.logChannel).send("Watching role successfully added for **" + userToModify.user.username + "**!");
          }
        }
      }
    }
    if (userList === undefined) {
      // No record of plex username exists in database; therefore it has not been setup and we do nothing.
      if (undefinedStreamers.indexOf(plexName) === -1) {
        // prevents logs from filling up with duplicate entries
        console.log("Unlinked active streamer detected: " + `${plexName}`);
        undefinedStreamers.push(plexName);
      }
    }
    else {
      for (let userList of client.getLinkByPlexUserName.all(`${plexName}`)) {
        // This is where we assign the watching role
        let guildSettings = client.getGuildSettings.get(userList.guild);
        userList.watching = "true";
        client.setUserList.run(userList);
        var tmpID = userList.id;
        userList = client.getLinkByID.get(tmpID);

        let userToModify = client.guilds.cache.get(userList.guild).members.resolve(userList.discordUserID);
        var bypass = false;

        if (userToModify === undefined) {
    			// User no longer exists in the Discord Server, we can't modify it at all so skip over them
    			continue;
    		}
        var roles = userToModify._roles;

        for (var y = 0; y < roles.length; y++) {
          if (roles[y] === guildSettings.watchingRole) {
            bypass = true;
          }
        }

        var roleOption = 0;
        if (client.guilds.cache.get(userList.guild).roles.fetch(guildSettings.watchingRole) === undefined) {
          // Role is invalid
          console.log("Invalid watching role detected, please re-apply role command.");
          return;
        } else {
          roleOption = 1;
        }

        if (client.guilds.cache.get(userList.guild).roles.cache.find(role => role.name === guildSettings.watchingRole) === null && roleOption === 0) {
          // Role is invalid
          console.log("Invalid watching role detected, please re-apply role command.");
          return;
        }

        if (!Boolean(bypass)) {
          userToModify.roles.add(guildSettings.watchingRole)
            .catch(console.error);
        }

        if (guildSettings.logChannelBoolean === "on") {
          var sendOption = 0;
          if (client.guilds.cache.get(userList.guild).channels.resolve(guildSettings.logChannel) === undefined) {
            // Channel is invalid
            console.log("Invalid logging channel detected, please re-apply logchannel command.");
            return;
          } else {
            sendOption = 1;
          }
          if (client.guilds.cache.get(userList.guild).channels.cache.find(channel => channel.name === guildSettings.logChannel) === null && sendOption === 0) {
            // Channel is invalid
            console.log("Invalid logging channel detected, please re-apply logchannel command.");
            return;
          }
          if (!Boolean(bypass) && sendOption === 1) {
            client.guilds.cache.get(userList.guild).channels.resolve(guildSettings.logChannel).send("Watching role successfully added for **" + userToModify.user.username + "**!");
          } else if (!Boolean(bypass)) {
            client.guilds.cache.get(userList.guild).channels.cache.find(channel => channel.name === guildSettings.logChannel).send("Watching role successfully added for **" + userToModify.user.username + "**!");
          }
        }
      }
    }

		mainProgram.updateNumberOfActiveUsers(); // Update numberOfActiveUsers variable with proper Stream Count
  }

  else if (data.trigger === 'recentlyAdded') {
    //console.log(data);

    const guildSettingsArray = [];
    for (const guildSettings of client.searchGuildSettings.iterate()) {
      guildSettingsArray.push(guildSettings);
    }

    for (const guildSettings of guildSettingsArray) {
      if (guildSettings.notificationChannelBoolean === "on") {
        if (data.contentType === "show") {
          var roleExists = "";
					var guildID = "";
					var existsInDatabase = false;
          for (const showNotification of client.searchTvShowsNotificationSettings.iterate()) {
            if (showNotification.title === data.show_name || showNotification.thetvdb_id === data.thetvdb_id || showNotification.imdbID_or_themoviedbID === data.imdb_id) {
							existsInDatabase = true;
							guildID = showNotification.guild;
							if (showNotification.groupRole != null && showNotification.groupRole != undefined && showNotification.groupRole != "") {
								roleExists = showNotification.groupRole;
							}
							else {
								roleExists = showNotification.roleID;
							}
							if (roleExists && roleExists != "") {
								roleExists = "<@&" + roleExists + ">";
							}
            }
          }

          if (!guildID || guildID === "") {
						// Show is not currently in database. Is it new or just ended?
            // Check if recentlyAddedBoolean is on. If yes, check if show is still airing. If yes, create role, add to database, update embed, and send out webhook

            if (guildSettings.recentlyAddedBoolean === "on") {
              // Grab a list of all shows in sonarr
              let tvShowsNotificationSettings;
              var json;
              for (let sonarrInstance in sonarr) {
                var tempJSON = await sonarr[sonarrInstance].getSeries();
                if (tempJSON == "error") {
              		return console.log("Couldn't connect to Sonarr, check your settings.");
              	}
                else {
                  if (json === "" || json === null || json === undefined) json = tempJSON;
                  else json = json.concat(tempJSON);  // join all sonarr instace results together
                }
              }
              // Let's remove any duplicate shows that are on multiple sonarr instances
              var tempJSON = [];
              for (var i = 0; i < json.length; i++) {
                var found = false;
                for (var j = 0; j < tempJSON.length; j++) {
                  if (tempJSON[j].title == json[i].title && tempJSON[j].tvdbId == json[i].tvdbId && tempJSON[j].imdbId == json[i].imdbId) {
                    found = true;
                    break;
                  }
                }
                if (!found) {
                  tempJSON.push(json[i]);
                }
              }
              json = tempJSON;
              // we now have a list of all sonarr shows stored in the json obect. now iterate through and see if the show is still airing

              var continuingShow = false;

              for (var i = 0; i < json.length; i++) {
                if ( (data.thetvdb_id == json[i].tvdbId || data.imdb_id == json[i].imdbId) && json[i].status == "continuing" ) {
                  // recentlyAddedBoolean is on, show is not in database, show is currently airing.
                  // We must now create a role, add it to the database, update embed, repeat initial loop and continue on finishing the hook.
                  continuingShow = true;
                  var roleLimitHit = false;

            			tvShowsNotificationSettings = client.getTvShowsNotificationSettings.get(`${json[i].cleanTitle}-${json[i].imdbId}-${guildSettings.guild}`);

            			if (!tvShowsNotificationSettings) {
            				// Create a new role with data
            				var role = await client.guilds.cache.get(guildSettings.guild).roles.cache.find(role => role.name === json[i].title);

            				if (role) {
            					tvShowsNotificationSettings = { id: `${json[i].cleanTitle}-${json[i].imdbId}-${guildSettings.guild}`, guild: guildSettings.guild, title: json[i].title, cleanTitle: json[i].cleanTitle, sortTitle: json[i].sortTitle, imdbID_or_themoviedbID: json[i].imdbId, thetvdb_id: `${json[i].tvdbId}`, status: json[i].status, is_group: null, groupName: null, groupRole: null, exclude: null, include: null, network: json[i].network, completeSonarr: JSON.stringify(json[i]), roleID: role.id};
            					client.setTvShowsNotificationSettings.run(tvShowsNotificationSettings);
            					tvShowsNotificationSettings = client.getTvShowsNotificationSettings.get(`${json[i].cleanTitle}-${json[i].imdbId}-${guildSettings.guild}`);
                      prepUpdateEmbed(guildSettings.guild, tvShowsNotificationSettings, roleLimitHit, data, existsInDatabase, roleExists, guildSettings);
            				}
            				else if (!roleLimitHit) {
            					let newRole = await client.guilds.cache.get(guildSettings.guild).roles.create({
            						data: {
            							name: json[i].title,
            							color: 'BLUE',
            							mentionable: true
            						}
            					})
            						.then(role => {
            							tvShowsNotificationSettings = { id: `${json[i].cleanTitle}-${json[i].imdbId}-${guildSettings.guild}`, guild: guildSettings.guild, title: json[i].title, cleanTitle: json[i].cleanTitle, sortTitle: json[i].sortTitle, imdbID_or_themoviedbID: json[i].imdbId, thetvdb_id: `${json[i].tvdbId}`, status: json[i].status, is_group: null, groupName: null, groupRole: null, exclude: null, include: null, network: json[i].network, completeSonarr: JSON.stringify(json[i]), roleID: role.id};
            							client.setTvShowsNotificationSettings.run(tvShowsNotificationSettings);
            							tvShowsNotificationSettings = client.getTvShowsNotificationSettings.get(`${json[i].cleanTitle}-${json[i].imdbId}-${guildSettings.guild}`);
                          prepUpdateEmbed(guildSettings.guild, tvShowsNotificationSettings, roleLimitHit, data, existsInDatabase, roleExists, guildSettings);
            						})
            						.catch(function(error) {
                          if (error.code == 30005) {
                            //Max Role Count on Server Hit
                            if (!roleLimitHit) {
                              console.log(error);
                            }
                            tvShowsNotificationSettings = { id: `${json[i].cleanTitle}-${json[i].imdbId}-${guildSettings.guild}`, guild: guildSettings.guild, title: json[i].title, cleanTitle: json[i].cleanTitle, sortTitle: json[i].sortTitle, imdbID_or_themoviedbID: json[i].imdbId, thetvdb_id: `${json[i].tvdbId}`, status: json[i].status, is_group: null, groupName: null, groupRole: null, exclude: null, include: null, network: json[i].network, completeSonarr: JSON.stringify(json[i]), roleID: null};
              							client.setTvShowsNotificationSettings.run(tvShowsNotificationSettings);
              							tvShowsNotificationSettings = client.getTvShowsNotificationSettings.get(`${json[i].cleanTitle}-${json[i].imdbId}-${guildSettings.guild}`);
                            roleLimitHit = true;
                            prepUpdateEmbed(guildSettings.guild, tvShowsNotificationSettings, roleLimitHit, data, existsInDatabase, roleExists, guildSettings);
                          }
                          else {
                            console.log(error);
                          }
                        });
            				}
            			}
                }
              }
              if (!continuingShow) {
                // Show is not in database but is also not continuing
                guildID = guildSettings.guild;
                finishShowHook(data, existsInDatabase, guildID, roleExists, guildSettings);
              }

            }
            else {
              guildID = guildSettings.guild;
              finishShowHook(data, existsInDatabase, guildID, roleExists, guildSettings);
            }
					}
          else {
            guildID = guildSettings.guild;
            finishShowHook(data, existsInDatabase, guildID, roleExists, guildSettings);
          }
        }
				else if (data.contentType === "movie") {
					var roleExists = "";
					var guildID = guildSettings.guild;

					for (const notificationSettings of client.searchNotificationSettings.iterate()) {
						if (notificationSettings.category === "movies") {
							if (notificationSettings.name === "All Movies" && (notificationSettings.roleID != null || notificationSettings.roleID != undefined)) {
								if (roleExists && roleExists != "") {
									roleExists = roleExists + ", <@&" + notificationSettings.roleID + ">";
								} else {
									roleExists = "<@&" + notificationSettings.roleID + ">";
								}
							}
							if (notificationSettings.name === "New Movies" && (notificationSettings.roleID != null || notificationSettings.roleID != undefined)) {
                var releaseDate = new Date(data.release_date).getTime();
								var today = new Date();
								var from = today.setMonth(today.getMonth() - 9);
								from = new Date(from).getTime();

								if(releaseDate >= from) {
   								// Movie is within 9 months old
									if (roleExists && roleExists != "") {
										roleExists = roleExists + ", <@&" + notificationSettings.roleID + ">";
									} else {
										roleExists = "<@&" + notificationSettings.roleID + ">";
									}
								}
								else {
									//console.log("Older than 9 months");
								}
							}
						}
					}

					// form embed and send
					embed = new Discord.MessageEmbed()
						.setTitle(`${data.title}`)
						.setURL(`${data.plex_url}`)
						.setDescription(`${data.summary}`)
						.setThumbnail(`${data.poster_url}`)
						.addField('View Details', `[Plex Web](${data.plex_url})`)
						.setTimestamp(new Date())
						.setColor(0x00AE86);
					var messageBody = data.messageContent + "\n" + roleExists;
					client.guilds.cache.get(guildID).channels.resolve(guildSettings.notificationChannel).send(messageBody, {embed}).catch(console.error);

				}
				else if (data.contentType === "music") {

				}
      }
    }
  }
}
