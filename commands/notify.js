module.exports = {
	name: 'notify',
  aliases: ['logs', 'logging', 'logchannel'],
	description: 'Select the notification settings for the current channel.',
	usage: '',
	adminCommand: true,
	subcommands: {

	},
	async execute(message, args, prefix, guildSettings, client, Discord, config, fetch, exemptEmbedReactRoles, tautulli, sonarr, notificationSettings, args2, ogCommand, command) {
    if (!message.channel.guild.member(message.author).hasPermission('ADMINISTRATOR')) return message.channel.send('You do not have permissions to use `' + prefix + 'notify`');

    var emojiOptions = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
    const filter = (reaction, user) => emojiOptions.indexOf(reaction.emoji.name) != -1;

    var setDescription = "";
    exemptEmbedReactRoles.push(`Notification Options`);
    embed = new Discord.MessageEmbed()
      .setAuthor('Notification Options') //don't foget to edit exemptEmbedReactRoles above if name changes so it is ignored in index.js role react
      .setTimestamp(new Date())
      .setColor(0x00AE86);

    var notCurrentlyEnabledList = [];
    var enabledInDifferentChannelList = [];
    var enabledList = [];
    var watchinglogNotifierName = "Watching Log";
    var notificationNotifierName = "Content Notifications";
    var changelogNotifierName = "Update Changelog";

    // Get Watching Log Info
    if (guildSettings.logChannelBoolean == "on") {
      if (message.channel.id == guildSettings.logChannel) {
        enabledList.push(watchinglogNotifierName);
      }
      else {
        enabledInDifferentChannelList.push(watchinglogNotifierName);
      }
    }
    else {
      notCurrentlyEnabledList.push(watchinglogNotifierName);
    }

    // Get Content Notifiaction Channel Info
    if (guildSettings.notificationChannelBoolean == "on") {
      if (message.channel.id == guildSettings.notificationChannel) {
        enabledList.push(notificationNotifierName);
      }
      else {
        enabledInDifferentChannelList.push(notificationNotifierName);
      }
    }
    else {
      notCurrentlyEnabledList.push(notificationNotifierName);
    }

    // Get Changelof Notifiaction Channel Info
    if (guildSettings.changelogChannelBoolean == "on") {
      if (message.channel.id == guildSettings.changelogChannel) {
        enabledList.push(changelogNotifierName);
      }
      else {
        enabledInDifferentChannelList.push(changelogNotifierName);
      }
    }
    else {
      notCurrentlyEnabledList.push(changelogNotifierName);
    }

    var count = 0;
    var emojiNotifierList = {};

    if (notCurrentlyEnabledList.length > 0) {
      if (notCurrentlyEnabledList.length == 1) setDescription = "**The option below can be enabled for the current channel:**";
      else setDescription = "**The options below can be enabled for the current channel:**";
      for (let i = 0; i < notCurrentlyEnabledList.length; i++) {
        setDescription = `${setDescription}\n${emojiOptions[count]} ${notCurrentlyEnabledList[i]}`;
        emojiNotifierList[emojiOptions[count]] = `${notCurrentlyEnabledList[i]}`;
        count++;
      }
    }

    if (enabledInDifferentChannelList.length > 0) {
      if (enabledInDifferentChannelList.length == 1) {
        if (setDescription != "") setDescription = `${setDescription}\n\n**The option below is enabled in a different channel but can be moved here:**`;
        else setDescription = `**The option below is enabled in a different channel but can be moved here:**`;
      }
      else {
        if (setDescription != "") setDescription = `${setDescription}\n\n**The options below are enabled in a different channel but can be moved here:**`;
        else setDescription = `**The options below are enabled in a different channel but can be moved here:**`;
      }

      for (let i = 0; i < enabledInDifferentChannelList.length; i++) {
        setDescription = `${setDescription}\n${emojiOptions[count]} ${enabledInDifferentChannelList[i]}`;
        emojiNotifierList[emojiOptions[count]] = `${enabledInDifferentChannelList[i]}`;
        count++;
      }
    }

    if (enabledList.length > 0) {
      if (enabledList.length == 1) {
        if (setDescription != "") setDescription = `${setDescription}\n\n**The option below is currently enabled but can be disabled:**`;
        else setDescription = `**The option below is currently enabled but can be disabled:**`;
      }
      else {
        if (setDescription != "") setDescription = `${setDescription}\n\n**The options below are currently enabled but can be disabled:**`;
        else setDescription = `**The options below are currently enabled but can be disabled:**`;
      }

      for (let i = 0; i < enabledList.length; i++) {
        setDescription = `${setDescription}\n${emojiOptions[count]} ${enabledList[i]}`;
        emojiNotifierList[emojiOptions[count]] = `${enabledList[i]}`;
        count++;
      }
    }

    embed.setDescription(setDescription);
    let sentMessage = await message.channel.send({embed});
    sentMessage.react(emojiOptions[0])
      .then(async () => {
        sentMessage.awaitReactions(filter, { time: 15000 })
          .then(collected => {
            // This is where changes are processed
            var selectedEmojis = [];
            collected.each(selectedOptions => {
              if (selectedOptions.users.cache.get(message.author.id) != undefined) {
                selectedEmojis.push(selectedOptions._emoji.name);
              }
            });

            var newNotCurrentlyEnabledList = [];
            var newEnabledMovedInFromDifferentChannelList = [];
            var newEnabledList = [];

            for (let i = 0; i < selectedEmojis.length; i++) {
              var item = emojiNotifierList[selectedEmojis[i]];

              if (notCurrentlyEnabledList.indexOf(item) != -1) {
                // This item was selected and used to be in the notCurrentlyEnabledList
                newEnabledList.push(item);
              }
              else if (enabledInDifferentChannelList.indexOf(item) != -1) {
                // This item was selected and used to be in the enabledInDifferentChannelList
                newEnabledMovedInFromDifferentChannelList.push(item);
              }
              else if (enabledList.indexOf(item) != -1) {
                // This item was selected and used to be in the enabledList
                newNotCurrentlyEnabledList.push(item);
              }
            }

            var setResponseDescription = "";
            embed = new Discord.MessageEmbed()
              .setTimestamp(new Date())
              .setColor(0x00AE86);

            if (newEnabledList.length > 0) {
              setResponseDescription = "**The following notification option(s) were enabled in this channel:**";
              for (let i = 0; i < newEnabledList.length; i++) {
                setResponseDescription = `${setResponseDescription}\n${newEnabledList[i]}`;

                if (newEnabledList[i] == watchinglogNotifierName) {
                  // Change the Watching Log Database Column
                  guildSettings.logChannel = message.channel.id;
                  guildSettings.logChannelBoolean = "on";
                  client.setGuildSettings.run(guildSettings);
                  guildSettings = client.getGuildSettings.get(message.guild.id);
                }
                else if (newEnabledList[i] == notificationNotifierName) {
                  // Change the Content Notification Database Column
                  guildSettings.notificationChannel = message.channel.id;
                  guildSettings.notificationChannelBoolean = "on";
                  client.setGuildSettings.run(guildSettings);
                  guildSettings = client.getGuildSettings.get(message.guild.id);
                }
                else if (newEnabledList[i] == changelogNotifierName) {
                  // Change the Changelog Database Column
                  guildSettings.changelogChannel = message.channel.id;
                  guildSettings.changelogChannelBoolean = "on";
                  client.setGuildSettings.run(guildSettings);
                  guildSettings = client.getGuildSettings.get(message.guild.id);
                }
              }
            }

            if (newEnabledMovedInFromDifferentChannelList.length > 0) {
              if (setResponseDescription != "") setResponseDescription = `${setResponseDescription}\n\n**The following notification option(s) were moved to this channel:**`;
              else setResponseDescription = `**The following notification option(s) were moved to this channel:**`;

              for (let i = 0; i < newEnabledMovedInFromDifferentChannelList.length; i++) {
                setResponseDescription = `${setResponseDescription}\n${newEnabledMovedInFromDifferentChannelList[i]}`;

                if (newEnabledMovedInFromDifferentChannelList[i] == watchinglogNotifierName) {
                  // Change the Watching Log Database Column
                  guildSettings.logChannel = message.channel.id;
                  guildSettings.logChannelBoolean = "on";
                  client.setGuildSettings.run(guildSettings);
                  guildSettings = client.getGuildSettings.get(message.guild.id);
                }
                else if (newEnabledMovedInFromDifferentChannelList[i] == notificationNotifierName) {
                  // Change the Content Notification Database Column
                  guildSettings.notificationChannel = message.channel.id;
                  guildSettings.notificationChannelBoolean = "on";
                  client.setGuildSettings.run(guildSettings);
                  guildSettings = client.getGuildSettings.get(message.guild.id);
                }
                else if (newEnabledMovedInFromDifferentChannelList[i] == changelogNotifierName) {
                  // Change the Changelog Database Column
                  guildSettings.changelogChannel = message.channel.id;
                  guildSettings.changelogChannelBoolean = "on";
                  client.setGuildSettings.run(guildSettings);
                  guildSettings = client.getGuildSettings.get(message.guild.id);
                }
              }
            }

            if (newNotCurrentlyEnabledList.length > 0) {
              if (setResponseDescription != "") setResponseDescription = `${setResponseDescription}\n\n**The following notification option(s) were disabled:**`;
              else setResponseDescription = `**The following notification option(s) were disabled:**`;

              for (let i = 0; i < newNotCurrentlyEnabledList.length; i++) {
                setResponseDescription = `${setResponseDescription}\n${newNotCurrentlyEnabledList[i]}`;

                if (newNotCurrentlyEnabledList[i] == watchinglogNotifierName) {
                  // Change the Watching Log Database Column
                  guildSettings.logChannel = "";
                  guildSettings.logChannelBoolean = "off";
                  client.setGuildSettings.run(guildSettings);
                  guildSettings = client.getGuildSettings.get(message.guild.id);
                }
                else if (newNotCurrentlyEnabledList[i] == notificationNotifierName) {
                  // Change the Content Notification Database Column
                  guildSettings.notificationChannel = "";
                  guildSettings.notificationChannelBoolean = "off";
                  client.setGuildSettings.run(guildSettings);
                  guildSettings = client.getGuildSettings.get(message.guild.id);
                }
                else if (newNotCurrentlyEnabledList[i] == changelogNotifierName) {
                  // Change the Changelog Database Column
                  guildSettings.changelogChannel = "";
                  guildSettings.changelogChannelBoolean = "off";
                  client.setGuildSettings.run(guildSettings);
                  guildSettings = client.getGuildSettings.get(message.guild.id);
                }
              }
            }

            embed.setDescription(setResponseDescription);

            if (setResponseDescription == "") {
              embed = new Discord.MessageEmbed()
                .setDescription("**Nothing selected in time, no notification settings were changed!**")
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
