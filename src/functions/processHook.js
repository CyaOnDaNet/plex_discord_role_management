module.exports = async(data) => {
  // Processes Tautulli webhooks
	//console.log(`Hook incoming: "${data.trigger}"`);

  const Discord = require('discord.js');
  const mainProgram = require("../../index.js");
  const client = mainProgram.client;
  var sonarr = mainProgram.sonarr;
  var undefinedStreamers = mainProgram.undefinedStreamers;

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

    for (const guildSettings of client.searchGuildSettings.iterate()) {
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
