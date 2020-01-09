const Discord = require('discord.js');
const client = new Discord.Client();
const config = require("./config/config.json");
const SQLite = require("better-sqlite3");
const sql = new SQLite('./config/database.sqlite');
const schedule = require('node-schedule');
const Tautulli = require('tautulli-api');
const fetch = require('node-fetch');
const tautulliHook = require('./src/tautulli.js');

const fs = require('fs');
client.commands = new Discord.Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.name, command);
}

var undefinedStreamers = [];
var online = false;
var exemptEmbedReactRoles = [];

const DEBUG = 0;

const defaultGuildSettings = {
  prefix: config.defaultPrefix,
  logChannel: "plex_watching_logs",
  logChannelBoolean: "off",
  notificationChannel: "plex_notifications",
  notificationChannelBoolean: "off",
  adminRole: "Admin",
  watchingRole: "Watching Plex",
	customRoleCount: 0
}

client.login(config.botToken);
var tautulli = new Tautulli(config.tautulli_ip, config.tautulli_port, config.tautulli_api_key); // ip and port of Tautulli and YOUR Tautulli API token

client.on('ready', ()=> {
  console.log('The bot is now online!');
	online = true;
  client.user.setActivity('Plex | ' + defaultGuildSettings.prefix, { type: 'WATCHING' })

  const app = tautulliHook(config.node_hook_port);

  // Check if the table "guildSettings" exists.
  const tableGuildSettings = sql.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'guildSettings';").get();
  if (!tableGuildSettings['count(*)']) {
    // If the table isn't there, create it and setup the database correctly.
    sql.prepare("CREATE TABLE guildSettings (id TEXT PRIMARY KEY, guild TEXT, prefix TEXT, logChannel TEXT, logChannelBoolean TEXT, notificationChannel TEXT, notificationChannelBoolean TEXT, adminRole TEXT, watchingRole TEXT, customRoleCount INTEGER);").run();
    // Ensure that the "id" row is always unique and indexed.
    sql.prepare("CREATE UNIQUE INDEX idx_guildSettings_id ON guildSettings (id);").run();
    sql.pragma("synchronous = 1");
    sql.pragma("journal_mode = wal");
  }

  // And then we have prepared statements to get and set guildSettings data.
  client.getGuildSettings = sql.prepare("SELECT * FROM guildSettings WHERE guild = ?");
  client.searchGuildSettings = sql.prepare("SELECT * FROM guildSettings");
  client.setGuildSettings = sql.prepare("INSERT OR REPLACE INTO guildSettings (id, guild, prefix, logChannel, logChannelBoolean, notificationChannel, notificationChannelBoolean, adminRole, watchingRole, customRoleCount) VALUES (@id, @guild, @prefix, @logChannel, @logChannelBoolean, @notificationChannel, @notificationChannelBoolean, @adminRole, @watchingRole, @customRoleCount);");

  // Check if the table "userList" exists.
  const tableUserList = sql.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'userList';").get();
  if (!tableUserList['count(*)']) {
    // If the table isn't there, create it and setup the database correctly.
    sql.prepare("CREATE TABLE userList (id TEXT PRIMARY KEY, guild TEXT, discordUserID TEXT, plexUserName TEXT, watching TEXT);").run();
    // Ensure that the "id" row is always unique and indexed.
    sql.prepare("CREATE UNIQUE INDEX idx_userList_id ON userList (id);").run();
    sql.pragma("synchronous = 1");
    sql.pragma("journal_mode = wal");
  }

  // And then we have prepared statements to get and set userList data.
  client.getLinkByDiscordUserID = sql.prepare("SELECT * FROM userList WHERE discordUserID = ?");
  client.getLinkByPlexUserName = sql.prepare("SELECT * FROM userList WHERE plexUserName = ?");
  client.searchGuildUserList = sql.prepare("SELECT * FROM userList");
  client.setUserList = sql.prepare("INSERT OR REPLACE INTO userList (id, guild, discordUserID, plexUserName, watching) VALUES (@id, @guild, @discordUserID, @plexUserName, @watching);");

  // Check if the table "tvShowsNotificationSettings" exists.
  const tableTvShowsNotificationSettings = sql.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'tvShowsNotificationSettings';").get();
  if (!tableTvShowsNotificationSettings['count(*)']) {
    // If the table isn't there, create it and setup the database correctly.
    sql.prepare("CREATE TABLE tvShowsNotificationSettings (id TEXT PRIMARY KEY, guild TEXT, title TEXT, cleanTitle TEXT, sortTitle TEXT, imdbID_or_themoviedbID TEXT, thetvdb_id TEXT, status TEXT, is_group TEXT, groupName TEXT, groupRole TEXT, exclude TEXT, include TEXT, network TEXT, completeSonarr TEXT, roleID TEXT);").run();
    // Ensure that the "id" row is always unique and indexed.
    sql.prepare("CREATE UNIQUE INDEX idx_tvShowsNotificationSettings_id ON tvShowsNotificationSettings (id);").run();
    sql.pragma("synchronous = 1");
    sql.pragma("journal_mode = wal");
  }

  // And then we have prepared statements to get and set tvShowsNotificationSettings data.
	client.deleteTvShowsNotificationSettings = sql.prepare("DELETE FROM tvShowsNotificationSettings WHERE id = ?");
  client.getTvShowsNotificationSettings = sql.prepare("SELECT * FROM tvShowsNotificationSettings WHERE id = ?");
  client.searchTvShowsNotificationSettings = sql.prepare("SELECT * FROM tvShowsNotificationSettings");
  client.getTvShowsNotificationSettingsBySortTitle = sql.prepare("SELECT * FROM tvShowsNotificationSettings WHERE sortTitle = ?");
  client.getTvShowsNotificationSettingsByGroupName = sql.prepare("SELECT * FROM tvShowsNotificationSettings WHERE groupName = ?");
  client.setTvShowsNotificationSettings = sql.prepare("INSERT OR REPLACE INTO tvShowsNotificationSettings (id, guild, title, cleanTitle, sortTitle, imdbID_or_themoviedbID, thetvdb_id, status, is_group, groupName, groupRole, exclude, include, network, completeSonarr, roleID) VALUES (@id, @guild, @title, @cleanTitle, @sortTitle, @imdbID_or_themoviedbID, @thetvdb_id, @status, @is_group, @groupName, @groupRole, @exclude, @include, @network, @completeSonarr, @roleID);");

	// Check if the table "notificationSettings" exists.
  const tableNotificationSettings = sql.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'notificationSettings';").get();
  if (!tableNotificationSettings['count(*)']) {
    // If the table isn't there, create it and setup the database correctly.
    sql.prepare("CREATE TABLE notificationSettings (id TEXT PRIMARY KEY, guild TEXT, name TEXT, category TEXT, description TEXT, roleID TEXT);").run();
    // Ensure that the "id" row is always unique and indexed.
    sql.prepare("CREATE UNIQUE INDEX idx_notificationSettings_id ON notificationSettings (id);").run();
    sql.pragma("synchronous = 1");
    sql.pragma("journal_mode = wal");
  }

  // And then we have prepared statements to get and set tvShowsNotificationSettings data.
	client.deleteNotificationSettings = sql.prepare("DELETE FROM notificationSettings WHERE id = ?");
  client.getNotificationSettings = sql.prepare("SELECT * FROM notificationSettings WHERE id = ?");
  client.searchNotificationSettings = sql.prepare("SELECT * FROM notificationSettings");
  client.setNotificationSettings = sql.prepare("INSERT OR REPLACE INTO notificationSettings (id, guild, name, category, description, roleID) VALUES (@id, @guild, @name, @category, @description, @roleID);");

});

client.on('message', async message => {
  if (message.author.bot) return;
  let guildSettings;

  if (message.guild) {
    // Sets default server settings
    guildSettings = client.getGuildSettings.get(message.guild.id);
    if (!guildSettings) {
      guildSettings = { id: `${message.guild.id}-${client.user.id}`, guild: message.guild.id, prefix: defaultGuildSettings.prefix, logChannel: defaultGuildSettings.logChannel, logChannelBoolean: defaultGuildSettings.logChannelBoolean, notificationChannel: defaultGuildSettings.notificationChannel, notificationChannelBoolean: defaultGuildSettings.notificationChannelBoolean, adminRole: defaultGuildSettings.adminRole, watchingRole: defaultGuildSettings.watchingRole, customRoleCount: defaultGuildSettings.customRoleCount };
      client.setGuildSettings.run(guildSettings);
      guildSettings = client.getGuildSettings.get(message.guild.id);
    }
		generateNotificationSettings(message);
  }
  else {
    // DM Message
    return;
  }

  const prefix = guildSettings.prefix;

  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/g);
  const commandName = args.shift().toLowerCase();

  const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
	if (!command) return;

  try {
	  command.execute(message, args, prefix, guildSettings, client, Discord, tautulli, config, fetch, exemptEmbedReactRoles);
  } catch (error) {
	  console.error(error);
	  message.reply('there was an error trying to execute that command!');
  }
});

var j = schedule.scheduleJob('* */2 * * * *', function() {
  // Checks the plex server for activity using Tautulli and repeats every 2 minutes, serves as a fallback in the event webhook trigger has failed.
  let userList;

	if (online === false) {
		console.log("Database not ready yet");
		return;
	}

  tautulli.get('get_activity').then(async (result) => {

    var activeStreams = result.response.data.sessions;
    if (activeStreams.length === 0) {
      // Make sure nobody has the watching role
    }
    else {
      for (var i = 0; i < activeStreams.length; i++) {
        if (!activeStreams[i].user || activeStreams[i].user === undefined) break;

        try {
          userList = await client.getLinkByPlexUserName.get(`${activeStreams[i].user}`);
        } catch (err) {
          //...
          console.log("Database not ready yet");
        }
        //userList = await client.getLinkByPlexUserName.get(`${activeStreams[i].user}`).catch();
        if (userList === undefined) {
          // No record of plex username exists in database; therefore it has not been setup and we do nothing.
          if (undefinedStreamers.indexOf(activeStreams[i].user) === -1) {
            // prevents logs from filling up with duplicate entries
            console.log("Unlinked active streamer detected: " + `${activeStreams[i].user}`);
            undefinedStreamers.push(activeStreams[i].user);

						for (const guildSettings of client.searchGuildSettings.iterate()) {
							if (guildSettings.logChannelBoolean === "on") {
		            var sendOption = 0;
		            if (client.guilds.get(userList.guild).channels.get(guildSettings.logChannel) === undefined) {
		              // Channel is invalid
		              break;
		            } else {
		              sendOption = 1;
		            }
		            if (client.guilds.get(userList.guild).channels.find(channel => channel.name === guildSettings.logChannel) === null && sendOption === 0) {
		              // Channel is invalid
		              break;
		            }
		            if (!Boolean(bypass) && sendOption === 1) {
		              client.guilds.get(userList.guild).channels.get(guildSettings.logChannel).send("Unlinked active streamer detected: " + `${activeStreams[i].user}`);
		            } else if (!Boolean(bypass)) {
		              client.guilds.get(userList.guild).channels.find(channel => channel.name === guildSettings.logChannel).send("Unlinked active streamer detected: " + `${activeStreams[i].user}`);
		            }
		          }
						}
          }
        } else {
          // This is where we assign the watching role
          let guildSettings = client.getGuildSettings.get(userList.guild);
          userList.watching = "true";
          client.setUserList.run(userList);
          userList = client.getLinkByPlexUserName.get(`${activeStreams[i].user}`);

          let userToModify = client.guilds.get(userList.guild).members.get(userList.discordUserID);

          var bypass = false;
          var roles = userToModify._roles;

          for (var y = 0; y < roles.length; y++) {
            if (roles[y] === guildSettings.watchingRole) {
              bypass = true;
            }
          }

          var roleOption = 0;
          if (client.guilds.get(userList.guild).roles.get(guildSettings.watchingRole) === undefined) {
            // Role is invalid
            console.log("Invalid watching role detected, please re-apply role command.");
            break;
          } else {
            roleOption = 1;
          }

          if (client.guilds.get(userList.guild).roles.find(role => role.name === guildSettings.watchingRole) === null && roleOption === 0) {
            // Role is invalid
            console.log("Invalid watching role detected, please re-apply role command.");
            break;
          }

          if (!Boolean(bypass)) {
            userToModify.addRole(guildSettings.watchingRole)
              .catch(console.error);
          }

          if (guildSettings.logChannelBoolean === "on") {
            var sendOption = 0;
            if (client.guilds.get(userList.guild).channels.get(guildSettings.logChannel) === undefined) {
              // Channel is invalid
              console.log("Invalid logging channel detected, please re-apply logchannel command.");
              break;
            } else {
              sendOption = 1;
            }
            if (client.guilds.get(userList.guild).channels.find(channel => channel.name === guildSettings.logChannel) === null && sendOption === 0) {
              // Channel is invalid
              console.log("Invalid logging channel detected, please re-apply logchannel command.");
              break;
            }
            if (!Boolean(bypass) && sendOption === 1) {
              client.guilds.get(userList.guild).channels.get(guildSettings.logChannel).send("Watching role successfully added for **" + userToModify.user.username + "**!");
            } else if (!Boolean(bypass)) {
              client.guilds.get(userList.guild).channels.find(channel => channel.name === guildSettings.logChannel).send("Watching role successfully added for **" + userToModify.user.username + "**!");
            }
          }
        }
      }
    }

    try {
      // Now we recheck activeStreams to set watching to false for everyone else
      for (const watchingQuery of client.searchGuildUserList.iterate()) {
        if (watchingQuery.watching === 'true') {
          var bypass = false;
          for (var i = 0; i < activeStreams.length; i++) {
            if (watchingQuery.plexUserName === activeStreams[i].user) {
              bypass = true;
            }
          }
          if (!Boolean(bypass)) {
            // This is where we remove the watching role
            let userToModify = client.guilds.get(watchingQuery.guild).members.get(watchingQuery.discordUserID);
            let guildSettings = client.getGuildSettings.get(watchingQuery.guild);
            var bypassAgain = true;
            var roles = userToModify._roles;

            for (var i = 0; i < roles.length; i++) {
              if (roles[i] === guildSettings.watchingRole) {
                bypassAgain = false;
              }
            }

            if (!Boolean(bypassAgain)) {
              userToModify.removeRole(guildSettings.watchingRole)
                .catch(console.error);
            }

            if (guildSettings.logChannelBoolean === "on") {
              var channelOption = 0;
              if (client.guilds.get(watchingQuery.guild).channels.get(guildSettings.logChannel) === undefined) {
                // Channel is invalid
                console.log("Invalid logging channel detected, please re-apply logchannel command.");
                break;
              } else {
                channelOption = 1;
              }
              if (client.guilds.get(watchingQuery.guild).channels.find(channel => channel.name === guildSettings.logChannel) === null && channelOption === 0) {
                // Channel is invalid
                console.log("Invalid logging channel detected, please re-apply logchannel command.");
                break;
              }
              if (!Boolean(bypassAgain) && channelOption === 1) {
                client.guilds.get(watchingQuery.guild).channels.get(guildSettings.logChannel).send("Watching role successfully removed for **" + userToModify.user.username + "**!");
              } else if (!Boolean(bypassAgain)) {
                client.guilds.get(watchingQuery.guild).channels.find(channel => channel.name === guildSettings.logChannel).send("Watching role successfully removed for **" + userToModify.user.username + "**!");
              }
            }
          }
        }
      }
    } catch (err) {
      //...
      console.log("Database not ready yet");
    }

  }).catch((error) => {
    console.log("Couldn't connect to Tautulli, check your settings.");
    //console.log(error);
    // do we need to remove roles if this is the case? Maybe we don't...
  });
});


// This makes the events used a bit more readable
const events = {
	MESSAGE_REACTION_ADD: 'messageReactionAdd',
	MESSAGE_REACTION_REMOVE: 'messageReactionRemove',
};

// This event handles adding/removing users from the role(s) they chose based on message reactions
client.on('raw', async event => {
    if (!events.hasOwnProperty(event.t)) return;

    const { d: data } = event;
    const user = client.users.get(data.user_id);
    const channel = client.channels.get(data.channel_id);

    const message = await channel.fetchMessage(data.message_id);
    const member = message.guild.members.get(user.id);

    const emojiKey = (data.emoji.id) ? `${data.emoji.name}:${data.emoji.id}` : data.emoji.name;
    let reaction = message.reactions.get(emojiKey);

    if (!reaction) {
        // Create an object that can be passed through the event like normal
        const emoji = new Emoji(client.guilds.get(data.guild_id), data.emoji).catch();
        reaction = new MessageReaction(message, emoji, 1, data.user_id === client.user.id).catch();
    }
    // Everything above grabs the emoji that was clicked by a user, The below code then matches the react emoji to the role and adds or removes it.
    if (client.user.id != message.author.id) return; //Only continue if react was to a message by this bot.
    if (message.embeds[0] === undefined || message.embeds[0] === null) return; //Only continue if react was to a message embed.
    if (client.user.id === data.user_id) return; //Ignore the bot setting up react roles so it doesnt add roles to itself.


		for (let exemptNames of exemptEmbedReactRoles) {
			//return if an embed was called that needed emoji response to prevent accidentally trying to react role
			if(message.embeds[0].author.name === exemptNames) return;
		}

    var args = message.embeds[0].description.trim().split(/\r?\n/);
    for (var i = 0; i < args.length; i++){
      if(args[i].startsWith(emojiKey)) {
        if (args[i].indexOf("<@&") === -1) return console.log("Invalid React Role Mention Clicked: " + args[i]);

        var roleID = args[i].slice(args[i].indexOf("<@&") + 3, args[i].indexOf(">"));
        var removeRole = true;

        reaction.users.tap(async user => {
          if (data.user_id === user.id) {
            removeRole = false;
            let userToModify = message.guild.members.get(user.id);
            userToModify.addRole(roleID)
              .catch(console.error);
          }
        });
        if (removeRole) {
          let userToModify = message.guild.members.get(user.id);
          userToModify.removeRole(roleID)
            .catch(console.error);
        }
      }
    }

});


async function processHook(data) {
  // Processes Tautulli webhooks

  if (data.trigger === 'playbackStopped') {
    var plexName = data.user;
    let userList;
    userList = client.getLinkByPlexUserName.get(`${plexName}`);
    if (userList === undefined) {
      plexName = data.username;
      userList = client.getLinkByPlexUserName.get(`${plexName}`);
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
      // This is where we remove the watching role
      let userToModify = client.guilds.get(userList.guild).members.get(userList.discordUserID);
      let guildSettings = client.getGuildSettings.get(userList.guild);
      var bypass = true;
      var roles = userToModify._roles;

      for (var i = 0; i < roles.length; i++) {
        if (roles[i] === guildSettings.watchingRole) {
          bypass = false;
        }
      }

      if (!Boolean(bypass)) {
        userToModify.removeRole(guildSettings.watchingRole)
          .catch(console.error);
      }

      if (guildSettings.logChannelBoolean === "on") {
        var channelOption = 0;
        if (client.guilds.get(userList.guild).channels.get(guildSettings.logChannel) === undefined) {
          // Channel is invalid
          console.log("Invalid logging channel detected, please re-apply logchannel command.");
          return;
        } else {
          channelOption = 1;
        }
        if (client.guilds.get(userList.guild).channels.find(channel => channel.name === guildSettings.logChannel) === null && channelOption === 0) {
          // Channel is invalid
          console.log("Invalid logging channel detected, please re-apply logchannel command.");
          return;
        }
        if (!Boolean(bypass) && channelOption === 1) {
          client.guilds.get(userList.guild).channels.get(guildSettings.logChannel).send("Watching role successfully removed for **" + userToModify.user.username + "**!");
        } else if (!Boolean(bypass)) {
          client.guilds.get(userList.guild).channels.find(channel => channel.name === guildSettings.logChannel).send("Watching role successfully removed for **" + userToModify.user.username + "**!");
        }
      }
    }
  }

  else if (data.trigger === 'playbackStarted') {
    let userList;
    var plexName = data.user;
    userList = client.getLinkByPlexUserName.get(`${plexName}`);
    if (userList === undefined) {
      plexName = data.username;
      userList = client.getLinkByPlexUserName.get(`${plexName}`);
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
      // This is where we assign the watching role
      let guildSettings = client.getGuildSettings.get(userList.guild);
      userList.watching = "true";
      client.setUserList.run(userList);
      userList = client.getLinkByPlexUserName.get(`${plexName}`);

      let userToModify = client.guilds.get(userList.guild).members.get(userList.discordUserID);

      var bypass = false;
      var roles = userToModify._roles;

      for (var y = 0; y < roles.length; y++) {
        if (roles[y] === guildSettings.watchingRole) {
          bypass = true;
        }
      }

      var roleOption = 0;
      if (client.guilds.get(userList.guild).roles.get(guildSettings.watchingRole) === undefined) {
        // Role is invalid
        console.log("Invalid watching role detected, please re-apply role command.");
        return;
      } else {
        roleOption = 1;
      }

      if (client.guilds.get(userList.guild).roles.find(role => role.name === guildSettings.watchingRole) === null && roleOption === 0) {
        // Role is invalid
        console.log("Invalid watching role detected, please re-apply role command.");
        return;
      }

      if (!Boolean(bypass)) {
        userToModify.addRole(guildSettings.watchingRole)
          .catch(console.error);
      }

      if (guildSettings.logChannelBoolean === "on") {
        var sendOption = 0;
        if (client.guilds.get(userList.guild).channels.get(guildSettings.logChannel) === undefined) {
          // Channel is invalid
          console.log("Invalid logging channel detected, please re-apply logchannel command.");
          return;
        } else {
          sendOption = 1;
        }
        if (client.guilds.get(userList.guild).channels.find(channel => channel.name === guildSettings.logChannel) === null && sendOption === 0) {
          // Channel is invalid
          console.log("Invalid logging channel detected, please re-apply logchannel command.");
          return;
        }
        if (!Boolean(bypass) && sendOption === 1) {
          client.guilds.get(userList.guild).channels.get(guildSettings.logChannel).send("Watching role successfully added for **" + userToModify.user.username + "**!");
        } else if (!Boolean(bypass)) {
          client.guilds.get(userList.guild).channels.find(channel => channel.name === guildSettings.logChannel).send("Watching role successfully added for **" + userToModify.user.username + "**!");
        }
      }
    }
  }

  else if (data.trigger === 'recentlyAdded') {
    console.log(data);

    for (const guildSettings of client.searchGuildSettings.iterate()) {
      if (guildSettings.notificationChannelBoolean === "on") {
        if (data.contentType === "show") {
          var roleExists = "";
					var guildID = "";
          for (const showNotification of client.searchTvShowsNotificationSettings.iterate()) {
            if (showNotification.title === data.show_name || showNotification.thetvdb_id === data.thetvdb_id || showNotification.imdbID_or_themoviedbID === data.imdb_id) {
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

					if(!roleExists) {
						//rethink this
						//return console.log("A show was recently added but does not have a role mention");
					}
					// form embed and send
					embed = new Discord.RichEmbed()
						.setTitle(`${data.title}`)
						.setURL(`${data.plex_url}`)
						.setDescription(`${data.summary}`)
						.setThumbnail(`${data.poster_url}`)
						.addField('View Details', `[Plex Web](${data.plex_url})`)
						.setTimestamp(new Date())
						.setColor(0x00AE86);
					var messageBody = data.messageContent + "\n" + roleExists;
					client.guilds.get(guildID).channels.get(guildSettings.notificationChannel).send(messageBody, {embed}).catch(console.error);
        }
      }
    }
  }
}


async function updateShowList(message) {
  // grabs list of currently airing shows and adds them to notifications channel
  let tvShowsNotificationSettings;
  var url = config.sonarr_web_address;
  if (!url) {
    console.log("No sonarr settings detected in `./config/config.json`!");
    return message.channel.send("No sonarr settings detected in `./config/config.json`!");
  }
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    // we need an http or https specified so we will asumme http
    console.log("Please adjust your config.sonarr_web_address to include http:// or https://. Since it was not included, I am assuming it is http://");
    url = "http://" + url;
  }
  if (!url.endsWith('/')) {
    url = url + '/';
  }
  url = url + "api/series?apikey=" + config.sonarr_api_key;

  fetch(url,  {
      method: 'GET'
  })
  .then(res => res.json())
  .then(async json => {
    let showsList = [];
    var count = 0;
    for (var i = 0; i < json.length; i++) {
      if (json[i].status === "continuing") {
        // Create an Entry for the show in the database
        showsList[count] = json[i].title;
        tvShowsNotificationSettings = client.getTvShowsNotificationSettings.get(`${json[i].cleanTitle}-${json[i].imdbId}-${message.guild.id}`);

        if (!tvShowsNotificationSettings) {
          // Create a new role with data
          var role = await message.guild.roles.find(role => role.name === json[i].title);

          if (role) {
            tvShowsNotificationSettings = { id: `${json[i].cleanTitle}-${json[i].imdbId}-${message.guild.id}`, guild: message.guild.id, title: json[i].title, cleanTitle: json[i].cleanTitle, sortTitle: json[i].sortTitle, imdbID_or_themoviedbID: json[i].imdbId, thetvdb_id: `${json[i].tvdbId}`, status: json[i].status, is_group: null, groupName: null, groupRole: null, exclude: null, include: null, network: json[i].network, completeSonarr: JSON.stringify(json[i]), roleID: role.id};
            client.setTvShowsNotificationSettings.run(tvShowsNotificationSettings);
            tvShowsNotificationSettings = client.getTvShowsNotificationSettings.get(`${json[i].cleanTitle}-${json[i].imdbId}-${message.guild.id}`);
          }
          else {
            let newRole = await message.guild.createRole({
              name: json[i].title,
              color: 'BLUE',
              mentionable: true
            })
              .then(role => {
                //console.log(`Created new role with name ${role.name} and color ${role.color}`)
                tvShowsNotificationSettings = { id: `${json[i].cleanTitle}-${json[i].imdbId}-${message.guild.id}`, guild: message.guild.id, title: json[i].title, cleanTitle: json[i].cleanTitle, sortTitle: json[i].sortTitle, imdbID_or_themoviedbID: json[i].imdbId, thetvdb_id: `${json[i].tvdbId}`, status: json[i].status, is_group: null, groupName: null, groupRole: null, exclude: null, include: null, network: json[i].network, completeSonarr: JSON.stringify(json[i]), roleID: role.id};
                client.setTvShowsNotificationSettings.run(tvShowsNotificationSettings);
                tvShowsNotificationSettings = client.getTvShowsNotificationSettings.get(`${json[i].cleanTitle}-${json[i].imdbId}-${message.guild.id}`);
              })
              .catch(console.error)
          }
        }
        count++;
      }
      else {
        // Delete an Entry for the show in the database
        tvShowsNotificationSettings = client.getTvShowsNotificationSettings.get(`${json[i].cleanTitle}-${json[i].imdbId}-${message.guild.id}`);

        if (tvShowsNotificationSettings && tvShowsNotificationSettings.include === null && tvShowsNotificationSettings.roleID != null) {
          await message.guild.roles.find(role => role.id === tvShowsNotificationSettings.roleID).delete()
					  .then(async () => {
					  	tvShowsNotificationSettings.roleID = null;
							tvShowsNotificationSettings.status = json[i].status;
					  	client.setTvShowsNotificationSettings.run(tvShowsNotificationSettings);
					  	tvShowsNotificationSettings = client.getTvShowsNotificationSettings.get(`${json[i].cleanTitle}-${json[i].imdbId}-${message.guild.id}`);
					  })
					  .catch(console.error);
        }
				else if (tvShowsNotificationSettings && tvShowsNotificationSettings.include != null && tvShowsNotificationSettings.roleID === null) {
					// Create a new role with data
          var role = await message.guild.roles.find(role => role.name === json[i].title);

          if (role) {
            tvShowsNotificationSettings.roleID = role.id;
						client.setTvShowsNotificationSettings.run(tvShowsNotificationSettings);
            tvShowsNotificationSettings = client.getTvShowsNotificationSettings.get(`${json[i].cleanTitle}-${json[i].imdbId}-${message.guild.id}`);
          }
          else {
            let newRole = await message.guild.createRole({
              name: json[i].title,
              color: 'BLUE',
              mentionable: true
            })
              .then(role => {
                tvShowsNotificationSettings.roleID = role.id;
								client.setTvShowsNotificationSettings.run(tvShowsNotificationSettings);
                tvShowsNotificationSettings = client.getTvShowsNotificationSettings.get(`${json[i].cleanTitle}-${json[i].imdbId}-${message.guild.id}`);
              })
              .catch(console.error)
          }
				}
				else if (!tvShowsNotificationSettings) {
					tvShowsNotificationSettings = { id: `${json[i].cleanTitle}-${json[i].imdbId}-${message.guild.id}`, guild: message.guild.id, title: json[i].title, cleanTitle: json[i].cleanTitle, sortTitle: json[i].sortTitle, imdbID_or_themoviedbID: json[i].imdbId, thetvdb_id: `${json[i].tvdbId}`, status: json[i].status, is_group: null, groupName: null, groupRole: null, exclude: null, include: null, network: json[i].network, completeSonarr: JSON.stringify(json[i]), roleID: null};
					client.setTvShowsNotificationSettings.run(tvShowsNotificationSettings);
					tvShowsNotificationSettings = client.getTvShowsNotificationSettings.get(`${json[i].cleanTitle}-${json[i].imdbId}-${message.guild.id}`);
				}
      }
    }
    return showsList;
  })
  .catch((error) => {
    console.log("Couldn't connect to Sonarr, check your settings.");
    message.channel.send("Couldn't connect to Sonarr, check your settings.");
    console.log(error);
  });
}

async function generateNotificationSettings(message) {
  let notificationSettings;

	notificationSettings = client.getNotificationSettings.get(`${message.guild.id}-${client.user.id}-All Movies`);
	if (!notificationSettings) {
		notificationSettings = { id: `${message.guild.id}-${client.user.id}-All Movies`, guild: message.guild.id, name: `All Movies`, category: `movies`, description: `Every movie added to Plex`, roleID: null };
		client.setNotificationSettings.run(notificationSettings);
	}

	notificationSettings = client.getNotificationSettings.get(`${message.guild.id}-${client.user.id}-New Movies`);
	if (!notificationSettings) {
		notificationSettings = { id: `${message.guild.id}-${client.user.id}-New Movies`, guild: message.guild.id, name: `New Movies`, category: `movies`, description: `Movies added this year`, roleID: null };
		client.setNotificationSettings.run(notificationSettings);
	}

	notificationSettings = client.getNotificationSettings.get(`${message.guild.id}-${client.user.id}-All TV Episodes`);
	if (!notificationSettings) {
		notificationSettings = { id: `${message.guild.id}-${client.user.id}-All TV Episodes`, guild: message.guild.id, name: `All TV Episodes`, category: `tv`, description: `Every TV episode!`, roleID: null };
		client.setNotificationSettings.run(notificationSettings);
	}

	notificationSettings = client.getNotificationSettings.get(`${message.guild.id}-${client.user.id}-New TV Shows`);
	if (!notificationSettings) {
		notificationSettings = { id: `${message.guild.id}-${client.user.id}-New TV Shows`, guild: message.guild.id, name: `New TV Shows`, category: `tv`, description: `New shows added to Plex`, roleID: null };
		client.setNotificationSettings.run(notificationSettings);
	}

	notificationSettings = client.getNotificationSettings.get(`${message.guild.id}-${client.user.id}-ABC (US)`);
	if (!notificationSettings) {
		notificationSettings = { id: `${message.guild.id}-${client.user.id}-ABC (US)`, guild: message.guild.id, name: `ABC (US)`, category: `networks`, description: ``, roleID: null };
		client.setNotificationSettings.run(notificationSettings);
	}

	notificationSettings = client.getNotificationSettings.get(`${message.guild.id}-${client.user.id}-Amazon`);
	if (!notificationSettings) {
		notificationSettings = { id: `${message.guild.id}-${client.user.id}-Amazon`, guild: message.guild.id, name: `Amazon`, category: `networks`, description: ``, roleID: null };
		client.setNotificationSettings.run(notificationSettings);
	}

	notificationSettings = client.getNotificationSettings.get(`${message.guild.id}-${client.user.id}-Disney+`);
	if (!notificationSettings) {
		notificationSettings = { id: `${message.guild.id}-${client.user.id}-Disney+`, guild: message.guild.id, name: `Disney+`, category: `networks`, description: ``, roleID: null };
		client.setNotificationSettings.run(notificationSettings);
	}

	notificationSettings = client.getNotificationSettings.get(`${message.guild.id}-${client.user.id}-CBS`);
	if (!notificationSettings) {
		notificationSettings = { id: `${message.guild.id}-${client.user.id}-CBS`, guild: message.guild.id, name: `CBS`, category: `networks`, description: ``, roleID: null };
		client.setNotificationSettings.run(notificationSettings);
	}

	notificationSettings = client.getNotificationSettings.get(`${message.guild.id}-${client.user.id}-FOX`);
	if (!notificationSettings) {
		notificationSettings = { id: `${message.guild.id}-${client.user.id}-FOX`, guild: message.guild.id, name: `FOX`, category: `networks`, description: ``, roleID: null };
		client.setNotificationSettings.run(notificationSettings);
	}

	notificationSettings = client.getNotificationSettings.get(`${message.guild.id}-${client.user.id}-HBO`);
	if (!notificationSettings) {
		notificationSettings = { id: `${message.guild.id}-${client.user.id}-HBO`, guild: message.guild.id, name: `HBO`, category: `networks`, description: ``, roleID: null };
		client.setNotificationSettings.run(notificationSettings);
	}

	notificationSettings = client.getNotificationSettings.get(`${message.guild.id}-${client.user.id}-NBC`);
	if (!notificationSettings) {
		notificationSettings = { id: `${message.guild.id}-${client.user.id}-NBC`, guild: message.guild.id, name: `NBC`, category: `networks`, description: ``, roleID: null };
		client.setNotificationSettings.run(notificationSettings);
	}

	notificationSettings = client.getNotificationSettings.get(`${message.guild.id}-${client.user.id}-Netflix`);
	if (!notificationSettings) {
		notificationSettings = { id: `${message.guild.id}-${client.user.id}-Netflix`, guild: message.guild.id, name: `Netflix`, category: `networks`, description: ``, roleID: null };
		client.setNotificationSettings.run(notificationSettings);
	}

	notificationSettings = client.getNotificationSettings.get(`${message.guild.id}-${client.user.id}-Showtime`);
	if (!notificationSettings) {
		notificationSettings = { id: `${message.guild.id}-${client.user.id}-Showtime`, guild: message.guild.id, name: `Showtime`, category: `networks`, description: ``, roleID: null };
		client.setNotificationSettings.run(notificationSettings);
	}

	notificationSettings = client.getNotificationSettings.get(`${message.guild.id}-${client.user.id}-The CW`);
	if (!notificationSettings) {
		notificationSettings = { id: `${message.guild.id}-${client.user.id}-The CW`, guild: message.guild.id, name: `The CW`, category: `networks`, description: ``, roleID: null };
		client.setNotificationSettings.run(notificationSettings);
	}
}

module.exports.updateShowList = updateShowList;
module.exports.processHook = processHook;
