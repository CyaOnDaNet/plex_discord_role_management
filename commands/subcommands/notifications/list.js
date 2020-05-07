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
    const mainProgram = require("../../../index.js");
    await mainProgram.updateShowList(message);
    await client.clearPreviousNotifierList.run(`${message.guild.id}`);

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
          showsList[i] = `| <@&${role.id}> | Group`;
        }
        else {
          showsList[i] = "| " + notificationSettings.groupName + " | Group";
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
          .catch(console.error);
      }
    }
  },
};
