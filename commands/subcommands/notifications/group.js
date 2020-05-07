module.exports = {
	name: 'group',
  aliases: [],
	description: 'Group up Multiple Notification Items',
	usage: 'New Group Name for Shows [show1] [show2] [etc.]',
	adminCommand: true,
	subcommands: {

	},
	async execute(message, args, prefix, guildSettings, client, Discord, config, fetch, exemptEmbedReactRoles, tautulli, sonarr, notificationSettings, args2, ogCommand, command) {
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
    embed = new Discord.MessageEmbed()
      .setAuthor('Sonarr Show Lookup:') //don't foget to edit exemptEmbedReactRoles above if name changes so it is ignored in index.js role react
      .setTimestamp(new Date())
      .setColor(0x00AE86);

    var description = "Select the emojis that correspond to the shows you want to group up:\n";
    var count = 0;
    var showEmojiList = {};
    for (var j = 0; j < showNamesToSearch.length; j++) {
      var json;
      for (let sonarrInstance in sonarr) {
        var tempJSON = await sonarr[sonarrInstance].lookUpSeries(showNamesToSearch[j]);
        if (tempJSON == "error") {
          console.log("Couldn't connect to Sonarr, check your settings.");
          return message.channel.send("Couldn't connect to Sonarr, check your settings.");
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
        for (var y = 0; y < tempJSON.length; y++) {
          if (tempJSON[y].title == json[i].title && tempJSON[y].tvdbId == json[i].tvdbId && tempJSON[y].imdbId == json[i].imdbId) {
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
            collected.each(selectedOptions => {
              if (selectedOptions.users.cache.get(message.author.id) != undefined) {
                selectedEmojis.push(selectedOptions._emoji.name);
              }
            });

            if (selectedEmojis.length == 0) {
              embed = new Discord.MessageEmbed()
                .setDescription("Nothing selected in time, nothing grouped.")
                .setTimestamp(new Date())
                .setColor(0x00AE86);
              return sentMessage.edit({embed});
            }
            else if (selectedEmojis.length == 1) {
              embed = new Discord.MessageEmbed()
                .setDescription("Nothing grouped up! A minimum of 2 shows need to be selected!")
                .setTimestamp(new Date())
                .setColor(0x00AE86);
              return sentMessage.edit({embed});
            }

            var roleLimitHit = false;

            let newRole = await message.guild.roles.cache.find(role => role.name === groupName);
            if (newRole) {
              let tvShowsNotificationSettings;
              var setDescription = "";

              for (let emojis of selectedEmojis) {
                tvShowsNotificationSettings = client.getTvShowsNotificationSettings.get(showEmojiList[emojis]);

                if (tvShowsNotificationSettings.roleID != null || tvShowsNotificationSettings.roleID != undefined) {
                  var oldRole = await message.guild.roles.cache.find(role => role.id === tvShowsNotificationSettings.roleID);
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
                    if (await message.guild.roles.cache.find(role => role.id === tvShowsNotificationSettings.roleID) != null) {
                      await message.guild.roles.cache.find(role => role.id === tvShowsNotificationSettings.roleID).delete()
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
                    else {
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
            embed = new Discord.MessageEmbed()
              .setDescription(setDescription)
              .setTimestamp(new Date())
              .setColor(0x00AE86);

            sentMessage.edit({embed});
            }
            if (!newRole) {
              newRole = await message.guild.roles.create({
                data: {
                  name: groupName,
                  color: 'BLUE',
                  mentionable: true
                }
              })
                .then(async role => {
                  let tvShowsNotificationSettings;
                  var setDescription = "";

                  for (let emojis of selectedEmojis) {
                    tvShowsNotificationSettings = client.getTvShowsNotificationSettings.get(showEmojiList[emojis]);

                    if (tvShowsNotificationSettings.roleID != null || tvShowsNotificationSettings.roleID != undefined) {
                      var oldRole = await message.guild.roles.cache.find(role => role.id === tvShowsNotificationSettings.roleID);
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
                        if (await message.guild.roles.cache.find(role => role.id === tvShowsNotificationSettings.roleID) != null) {
                          await message.guild.roles.cache.find(role => role.id === tvShowsNotificationSettings.roleID).delete()
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
                        else {
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
                embed = new Discord.MessageEmbed()
                  .setDescription(setDescription)
                  .setTimestamp(new Date())
                  .setColor(0x00AE86);

                sentMessage.edit({embed});

                })
                .catch(function(error) {
                  if (error.code == 30005) {
                    //Max Role Count on Server Hit
                    if (!roleLimitHit) {
                      setDescription = "Role could not be created due to hitting the discord limit, nothing grouped!";
                      embed = new Discord.MessageEmbed()
                        .setDescription(setDescription)
                        .setTimestamp(new Date())
                        .setColor(0x00AE86);

                      sentMessage.edit({embed});
                      console.log(error);
                    }
                    roleLimitHit = true;
                  }
                  else {
                    console.log(error);
                  }
                });
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
  },
};
