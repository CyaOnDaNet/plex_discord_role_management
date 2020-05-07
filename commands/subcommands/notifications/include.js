module.exports = {
	name: 'include',
  aliases: [],
	description: 'Manually include a show in notification settings',
	usage: 'show',
	adminCommand: true,
	subcommands: {

	},
	async execute(message, args, prefix, guildSettings, client, Discord, config, fetch, exemptEmbedReactRoles, tautulli, sonarr, notificationSettings, args2, ogCommand, command) {
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
    embed = new Discord.MessageEmbed()
      .setAuthor('Sonarr Show Lookup:') //don't foget to edit exemptEmbedReactRoles above if name changes so it is ignored in index.js role react
      .setTimestamp(new Date())
      .setColor(0x00AE86);

    var json;
    for (let sonarrInstance in sonarr) {
      var tempJSON = await sonarr[sonarrInstance].lookUpSeries(messageAfterCommand);
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
            collected.each(selectedOptions => {
              if (selectedOptions.users.cache.get(message.author.id) != undefined) {
                selectedEmojis.push(selectedOptions._emoji.name);
              }
            });

            let tvShowsNotificationSettings;
            var setDescription = "";
            var count2 = 0;
            var roleLimitHit = false;

            for(let emojis of selectedEmojis) {
              tvShowsNotificationSettings = client.getTvShowsNotificationSettings.get(showEmojiList[emojis]);
              if (tvShowsNotificationSettings.roleID === null || tvShowsNotificationSettings.roleID === undefined) {
                // Create role and store in database
                let newRole = await message.guild.roles.create({
                  data: {
                    name: tvShowsNotificationSettings.title,
                    color: 'BLUE',
                    mentionable: true
                  }
                })
                  .then(async role => {
                    tvShowsNotificationSettings.exclude = null;
                    tvShowsNotificationSettings.include = "true";
                    tvShowsNotificationSettings.roleID = role.id;
                    setDescription = setDescription + "\n > " + tvShowsNotificationSettings.title;
                    client.setTvShowsNotificationSettings.run(tvShowsNotificationSettings);
                    tvShowsNotificationSettings = client.getTvShowsNotificationSettings.get(showEmojiList[emojis]);
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

                count2++;
              }
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
                  .setDescription("Nothing selected in time, nothing included.")
                  .setTimestamp(new Date())
                  .setColor(0x00AE86);
              }
            }
            else {
              if (count2 == 1) {
                setDescription = "Successfully included the following show:" + setDescription;
              }
              else {
                setDescription = "Successfully included the following shows:" + setDescription;
              }

              if (roleLimitHit) {
                setDescription = "Roles could not be created due to hitting the discord limit!";
              }
              embed = new Discord.MessageEmbed()
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
  },
};
