const Discord = require('discord.js');
const client = new Discord.Client({ partials: ['MESSAGE', 'REACTION'] });

const SQLite = require("better-sqlite3");
const schedule = require('node-schedule');
const fetch = require('node-fetch');
const process = require('process');
const isDocker = require('is-docker');
const fs = require('fs');

var DEBUG = 0;   // Ignored if defined in config or env variable, 1 for database debugging, 2 for sonarr instance debugging, 3 for startup role checking

var configFile = null;
var config = {};
const tautulli = require('./src/tautulli.js');
const Sonarr = require('./src/sonarr.js');
const sql = new SQLite('./config/database.sqlite');

try {
	configFile = require("./config/config.json");
} catch(e) {
	// File does not exist, should be using docker environmental variables if thats the case.
	// assigning example config file to check process.env for present values
	configFile = require('./src/config.example.json');
}

if (isDocker()) {
  for (let [key, value] of Object.entries(configFile)) {
		// checking keys from provided config file to available env keys
		if (process.env[key] !== undefined) config[key] = process.env[key]
		else config[key] = configFile[key]
	}
}
else {
	config = require("./config/config.json");
}

if (config.DEBUG_MODE) DEBUG = config.DEBUG_MODE;
if(DEBUG != 0) console.log(`Debugging is enabled: Mode ${DEBUG}`);

var sonarr = {};
sonarr.sonarr1 = new Sonarr(config.sonarr_ip, config.sonarr_port, config.sonarr_api_key);
if (config.sonarr_ip_2 && config.sonarr_ip_2 != "OPTIONAL_ADDITIONAL_SONARR_IP_ADDRESS" && config.sonarr_ip_2 != "" && config.sonarr_ip_2 != null && config.sonarr_ip_2 != undefined) sonarr.sonarr2 = new Sonarr(config.sonarr_ip_2, config.sonarr_port_2, config.sonarr_api_key_2);
if (config.sonarr_ip_3 && config.sonarr_ip_3 != "OPTIONAL_ADDITIONAL_SONARR_IP_ADDRESS" && config.sonarr_ip_3 != "" && config.sonarr_ip_3 != null && config.sonarr_ip_3 != undefined) sonarr.sonarr3 = new Sonarr(config.sonarr_ip_3, config.sonarr_port_3, config.sonarr_api_key_3);

if(DEBUG == 2) {
  console.log(sonarr);
}

client.commands = new Discord.Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.name, command);
}

var undefinedStreamers = [];
var online = false;
var exemptEmbedReactRoles = [];

const defaultGuildSettings = {
  prefix: config.defaultPrefix,
  logChannel: "",
  logChannelBoolean: "off",
  notificationChannel: "",
  notificationChannelBoolean: "off",
  adminRole: "",
  watchingRole: "",
	customRoleCount: 0
}

client.login(config.botToken);

client.on('ready', ()=> {
  console.log('The bot is now online!');
  client.user.setActivity('Plex | ' + defaultGuildSettings.prefix + 'help', { type: 'WATCHING' })

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
  client.getLinkByID = sql.prepare("SELECT * FROM userList WHERE id = ?");
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
	client.getTvShowsByIMDB = sql.prepare("SELECT * FROM tvShowsNotificationSettings WHERE imdbID_or_themoviedbID = ?");
	client.getTvShowsByTHETVDB = sql.prepare("SELECT * FROM tvShowsNotificationSettings WHERE thetvdb_id = ?");
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

  // And then we have prepared statements to get and set notificationSettings data.
	client.deleteNotificationSettings = sql.prepare("DELETE FROM notificationSettings WHERE id = ?");
  client.getNotificationSettings = sql.prepare("SELECT * FROM notificationSettings WHERE id = ?");
  client.searchNotificationSettings = sql.prepare("SELECT * FROM notificationSettings");
  client.setNotificationSettings = sql.prepare("INSERT OR REPLACE INTO notificationSettings (id, guild, name, category, description, roleID) VALUES (@id, @guild, @name, @category, @description, @roleID);");

	// Check if the table "libraryExclusion" exists.
  const tableLibraryExclusion = sql.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'libraryExclusion';").get();
  if (!tableLibraryExclusion['count(*)']) {
    // If the table isn't there, create it and setup the database correctly.
    sql.prepare("CREATE TABLE libraryExclusion (id TEXT PRIMARY KEY, guild TEXT, name TEXT, excluded TEXT);").run();
    // Ensure that the "id" row is always unique and indexed.
    sql.prepare("CREATE UNIQUE INDEX idx_libraryExclusion_id ON libraryExclusion (id);").run();
    sql.pragma("synchronous = 1");
    sql.pragma("journal_mode = wal");
  }

  // And then we have prepared statements to get and set libraryExclusion data.
	client.deleteLibraryExclusionEntry = sql.prepare("DELETE FROM libraryExclusion WHERE id = ?");
  client.getLibraryExclusionSettings = sql.prepare("SELECT * FROM libraryExclusion WHERE id = ?");
  client.searchLibraryExclusionSettings = sql.prepare("SELECT * FROM libraryExclusion");
  client.setLibraryExclusionSettings = sql.prepare("INSERT OR REPLACE INTO libraryExclusion (id, guild, name, excluded) VALUES (@id, @guild, @name, @excluded);");

  // Check if the table "previousNotifierList" exists.
  const previousNotifierList = sql.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'previousNotifierList';").get();
  if (!previousNotifierList['count(*)']) {
    // If the table isn't there, create it and setup the database correctly.
    sql.prepare("CREATE TABLE previousNotifierList (id TEXT PRIMARY KEY, guild TEXT, messageID TEXT);").run();
    // Ensure that the "id" row is always unique and indexed.
    sql.prepare("CREATE UNIQUE INDEX idx_previousNotifierList_id ON previousNotifierList (id);").run();
    sql.pragma("synchronous = 1");
    sql.pragma("journal_mode = wal");
  }

  // And then we have prepared statements to get and set previousNotifierList data.
	client.clearPreviousNotifierList = sql.prepare("DELETE FROM previousNotifierList WHERE guild = ?");
  client.getPreviousNotifierList = sql.prepare("SELECT * FROM previousNotifierList WHERE id = ?");
  client.searchPreviousNotifierList = sql.prepare("SELECT * FROM previousNotifierList");
  client.setPreviousNotifierList = sql.prepare("INSERT OR REPLACE INTO previousNotifierList (id, guild, messageID) VALUES (@id, @guild, @messageID);");

  online = true;
  const tautulliService = tautulli(config, config.node_hook_port);

  updateReactRolesWhileOffline();
});

var runOnce = {};
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

    if (!runOnce[message.guild.id]) {
      generateNotificationSettings(message);
      runOnce[message.guild.id] = "done";
    }
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
	  command.execute(message, args, prefix, guildSettings, client, Discord, config, fetch, exemptEmbedReactRoles, tautulli, sonarr);
  } catch (error) {
	  console.error(error);
	  message.reply('there was an error trying to execute that command!');
  }
});

var j = schedule.scheduleJob('0 */2 * * * *', async function() {
  // Checks the plex server for activity using Tautulli and repeats every 2 minutes, serves as a fallback in the event webhook trigger has failed.

	if (online === false) {
    console.log("Database not ready for scheduled job, client not fully online yet. Waiting to try again...");
		return;
	}
	var result = await tautulli.tautulliService.getActivity();
	if (result == "error") {
		console.log("~Scheduled Watching Check Failed!~ Couldn't connect to Tautulli, check your settings.");
		return;
	}

	var activeStreams = result.data.sessions;
	if (activeStreams.length === 0) {
		// Make sure nobody has the watching role
	}
	else {
		for (var i = 0; i < activeStreams.length; i++) {
			if (!activeStreams[i].user || activeStreams[i].user === undefined) break;

			try {
        for (let userList of client.getLinkByPlexUserName.all(`${activeStreams[i].user}`)) {
          if (userList === undefined) {
            // No record of plex username exists in database; therefore it has not been setup and we do nothing.
            if (undefinedStreamers.indexOf(activeStreams[i].user) === -1) {
              // prevents logs from filling up with duplicate entries
              console.log("Unlinked active streamer detected: " + `${activeStreams[i].user}`);
              undefinedStreamers.push(activeStreams[i].user);

              for (const guildSettings of client.searchGuildSettings.iterate()) {
                if (guildSettings.logChannelBoolean === "on") {
                  var sendOption = 0;
                  if (client.guilds.cache.get(guildSettings.guild).channels.resolve(guildSettings.logChannel) === undefined) {
                    // Channel is invalid
                    break;
                  } else {
                    sendOption = 1;
                  }
                  if (client.guilds.cache.get(guildSettings.guild).channels.cache.find(channel => channel.name === guildSettings.logChannel) === null && sendOption === 0) {
                    // Channel is invalid
                    break;
                  }
                  if (!Boolean(bypass) && sendOption === 1) {
                    client.guilds.cache.get(guildSettings.guild).channels.resolve(guildSettings.logChannel).send("Unlinked active streamer detected: " + `**${activeStreams[i].user}**`);
                  } else if (!Boolean(bypass)) {
                    client.guilds.cache.get(guildSettings.guild).channels.cache.find(channel => channel.name === guildSettings.logChannel).send("Unlinked active streamer detected: " + `**${activeStreams[i].user}**`);
                  }
                }
              }
            }
          } else {
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
              break;
            } else {
              roleOption = 1;
            }

            if (client.guilds.cache.get(userList.guild).roles.cache.find(role => role.name === guildSettings.watchingRole) === null && roleOption === 0) {
              // Role is invalid
              console.log("Invalid watching role detected, please re-apply role command.");
              break;
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
                break;
              } else {
                sendOption = 1;
              }
              if (client.guilds.cache.get(userList.guild).channels.cache.find(channel => channel.name === guildSettings.logChannel) === null && sendOption === 0) {
                // Channel is invalid
                console.log("Invalid logging channel detected, please re-apply logchannel command.");
                break;
              }
              if (!Boolean(bypass) && sendOption === 1) {
                client.guilds.cache.get(userList.guild).channels.resolve(guildSettings.logChannel).send("Watching role successfully added for **" + userToModify.user.username + "**!");
              } else if (!Boolean(bypass)) {
                client.guilds.cache.get(userList.guild).channels.cache.find(channel => channel.name === guildSettings.logChannel).send("Watching role successfully added for **" + userToModify.user.username + "**!");
              }
            }
          }
        }
			} catch (err) {
				//...
        if (DEBUG == 1) {
          console.log(`Database not ready yet, failed on initial client.getLinkByPlexUserName.get(\`${activeStreams[i].user}\`).`);
          console.log(err)
        }
			}
		}
	}

	try {
		// Now we recheck activeStreams to set watching to false for everyone else
    var watchIsFalse = [];
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
					let userToModify = client.guilds.cache.get(watchingQuery.guild).members.resolve(watchingQuery.discordUserID);
					let guildSettings = client.getGuildSettings.get(watchingQuery.guild);
					var bypassAgain = true;

          if (userToModify === undefined) {
      			// User no longer exists in the Discord Server, we can't modify it at all so skip over them
      			continue;
      		}
					var roles = userToModify._roles;

					for (var i = 0; i < roles.length; i++) {
						if (roles[i] === guildSettings.watchingRole) {
							bypassAgain = false;
						}
					}

					if (!Boolean(bypassAgain)) {
            watchingQuery.watching = "false";
            watchIsFalse.push(watchingQuery);

						userToModify.roles.remove(guildSettings.watchingRole)
							.catch(console.error);
					}

					if (guildSettings.logChannelBoolean === "on") {
						var channelOption = 0;
						if (client.guilds.cache.get(watchingQuery.guild).channels.resolve(guildSettings.logChannel) === undefined) {
							// Channel is invalid
							console.log("Invalid logging channel detected, please re-apply logchannel command.");
							break;
						} else {
							channelOption = 1;
						}
						if (client.guilds.cache.get(watchingQuery.guild).channels.cache.find(channel => channel.name === guildSettings.logChannel) === null && channelOption === 0) {
							// Channel is invalid
							console.log("Invalid logging channel detected, please re-apply logchannel command.");
							break;
						}
						if (!Boolean(bypassAgain) && channelOption === 1) {
							client.guilds.cache.get(watchingQuery.guild).channels.resolve(guildSettings.logChannel).send("Watching role successfully removed for **" + userToModify.user.username + "**!");
						} else if (!Boolean(bypassAgain)) {
							client.guilds.cache.get(watchingQuery.guild).channels.cache.find(channel => channel.name === guildSettings.logChannel).send("Watching role successfully removed for **" + userToModify.user.username + "**!");
						}
					}
				}
			}
		}
    if (watchIsFalse) {
      for (var i = 0; i < watchIsFalse.length; i++) {
        client.setUserList.run(watchIsFalse[i]);
      }
    }
	} catch (err) {
		//...
    if (DEBUG == 1) {
      console.log("Database not ready yet, failed on recheck of activeStreams.");
      console.log(err)
    }
    else {
      console.log("Database not ready yet, waiting to try again...");
    }
	}
});

// Add react role event
client.on('messageReactionAdd', async (reaction, user) => {
	// When we receive a reaction we check if the reaction is partial or not
	if (reaction.partial) {
		// If the message this reaction belongs to was removed the fetching might result in an API error, which we need to handle
		try {
			await reaction.fetch();
		} catch (error) {
			console.log('Something went wrong when fetching the message: ', error);
			// Return as `reaction.message.author` may be undefined/null
			return;
		}
	}
	// Now the message has been cached and is fully available
	const message = reaction.message;

	if (client.user.id != message.author.id) return; //Only continue if react was to a message by this bot.
	if (message.embeds[0] === undefined || message.embeds[0] === null) return; //Only continue if react was to a message embed.
	if (client.user.id === reaction.user_id) return; //Ignore the bot setting up react roles so it doesnt add roles to itself.

	for (let exemptNames of exemptEmbedReactRoles) {
		//return if an embed was called that needed emoji response to prevent accidentally trying to react role
		if(message.embeds[0].author.name === exemptNames) return;
	}

	const emoji = reaction._emoji.id ? `${reaction._emoji.name}:${reaction._emoji.id}` : reaction._emoji.name;
	var args = message.embeds[0].description.trim().split(/\r?\n/);
	for (var i = 0; i < args.length; i++){
		if(args[i].startsWith(emoji)) {
			if (args[i].indexOf("<@&") === -1) return console.log("Invalid React Role Mention Clicked: " + args[i]);

			var roleID = args[i].slice(args[i].indexOf("<@&") + 3, args[i].indexOf(">"));

			let userToModify = message.guild.members.resolve(user.id);
			userToModify.roles.add(roleID)
				.catch(console.error);
		}
	}
});

// Remove react role event
client.on('messageReactionRemove', async (reaction, user) => {
	// When we receive a reaction we check if the reaction is partial or not
	if (reaction.partial) {
		// If the message this reaction belongs to was removed the fetching might result in an API error, which we need to handle
		try {
			await reaction.fetch();
		} catch (error) {
			console.log('Something went wrong when fetching the message: ', error);
			// Return as `reaction.message.author` may be undefined/null
			return;
		}
	}
	// Now the message has been cached and is fully available
	const message = reaction.message;

	if (client.user.id != message.author.id) return; //Only continue if react was to a message by this bot.
	if (message.embeds[0] === undefined || message.embeds[0] === null) return; //Only continue if react was to a message embed.
	if (client.user.id === reaction.user_id) return; //Ignore the bot setting up react roles so it doesnt add roles to itself.

	for (let exemptNames of exemptEmbedReactRoles) {
		//return if an embed was called that needed emoji response to prevent accidentally trying to react role
		if(message.embeds[0].author.name === exemptNames) return;
	}

	const emoji = reaction._emoji.id ? `${reaction._emoji.name}:${reaction._emoji.id}` : reaction._emoji.name;
	var args = message.embeds[0].description.trim().split(/\r?\n/);
	for (var i = 0; i < args.length; i++){
		if(args[i].startsWith(emoji)) {
			if (args[i].indexOf("<@&") === -1) return console.log("Invalid React Role Mention Clicked: " + args[i]);

			var roleID = args[i].slice(args[i].indexOf("<@&") + 3, args[i].indexOf(">"));

			let userToModify = message.guild.members.resolve(user.id);
			userToModify.roles.remove(roleID)
				.catch(console.error);
		}
	}
});


async function processHook(data) {
  // Processes Tautulli webhooks
	//console.log(`Hook incoming: "${data.trigger}"`);

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

async function updateShowList(message) {
  // grabs list of currently airing shows and adds them to notifications channel
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

	let showsList = [];
	var count = 0;
  var roleLimitHit = false;
	for (var i = 0; i < json.length; i++) {
		if (json[i].status === "continuing") {
			// Create an Entry for the show in the database
			showsList[count] = json[i].title;
			tvShowsNotificationSettings = client.getTvShowsNotificationSettings.get(`${json[i].cleanTitle}-${json[i].imdbId}-${message.guild.id}`);

			if (!tvShowsNotificationSettings) {
				// Create a new role with data
				var role = await message.guild.roles.cache.find(role => role.name === json[i].title);

				if (role) {
					tvShowsNotificationSettings = { id: `${json[i].cleanTitle}-${json[i].imdbId}-${message.guild.id}`, guild: message.guild.id, title: json[i].title, cleanTitle: json[i].cleanTitle, sortTitle: json[i].sortTitle, imdbID_or_themoviedbID: json[i].imdbId, thetvdb_id: `${json[i].tvdbId}`, status: json[i].status, is_group: null, groupName: null, groupRole: null, exclude: null, include: null, network: json[i].network, completeSonarr: JSON.stringify(json[i]), roleID: role.id};
					client.setTvShowsNotificationSettings.run(tvShowsNotificationSettings);
					tvShowsNotificationSettings = client.getTvShowsNotificationSettings.get(`${json[i].cleanTitle}-${json[i].imdbId}-${message.guild.id}`);
				}
				else if (!roleLimitHit) {
					let newRole = await message.guild.roles.create({
						data: {
							name: json[i].title,
							color: 'BLUE',
							mentionable: true
						}
					})
						.then(role => {
							//console.log(`Created new role with name ${role.name} and color ${role.color}`)
							tvShowsNotificationSettings = { id: `${json[i].cleanTitle}-${json[i].imdbId}-${message.guild.id}`, guild: message.guild.id, title: json[i].title, cleanTitle: json[i].cleanTitle, sortTitle: json[i].sortTitle, imdbID_or_themoviedbID: json[i].imdbId, thetvdb_id: `${json[i].tvdbId}`, status: json[i].status, is_group: null, groupName: null, groupRole: null, exclude: null, include: null, network: json[i].network, completeSonarr: JSON.stringify(json[i]), roleID: role.id};
							client.setTvShowsNotificationSettings.run(tvShowsNotificationSettings);
							tvShowsNotificationSettings = client.getTvShowsNotificationSettings.get(`${json[i].cleanTitle}-${json[i].imdbId}-${message.guild.id}`);
						})
						.catch(function(error) {
              if (error.code == 30005) {
                //Max Role Count on Server Hit
                if (!roleLimitHit) {
                  console.log(error);
                }
                tvShowsNotificationSettings = { id: `${json[i].cleanTitle}-${json[i].imdbId}-${message.guild.id}`, guild: message.guild.id, title: json[i].title, cleanTitle: json[i].cleanTitle, sortTitle: json[i].sortTitle, imdbID_or_themoviedbID: json[i].imdbId, thetvdb_id: `${json[i].tvdbId}`, status: json[i].status, is_group: null, groupName: null, groupRole: null, exclude: null, include: null, network: json[i].network, completeSonarr: JSON.stringify(json[i]), roleID: null};
  							client.setTvShowsNotificationSettings.run(tvShowsNotificationSettings);
  							tvShowsNotificationSettings = client.getTvShowsNotificationSettings.get(`${json[i].cleanTitle}-${json[i].imdbId}-${message.guild.id}`);
                roleLimitHit = true;
              }
              else {
                console.log(error);
              }
            });
				}
        else {
          tvShowsNotificationSettings = { id: `${json[i].cleanTitle}-${json[i].imdbId}-${message.guild.id}`, guild: message.guild.id, title: json[i].title, cleanTitle: json[i].cleanTitle, sortTitle: json[i].sortTitle, imdbID_or_themoviedbID: json[i].imdbId, thetvdb_id: `${json[i].tvdbId}`, status: json[i].status, is_group: null, groupName: null, groupRole: null, exclude: null, include: null, network: json[i].network, completeSonarr: JSON.stringify(json[i]), roleID: null};
          client.setTvShowsNotificationSettings.run(tvShowsNotificationSettings);
          tvShowsNotificationSettings = client.getTvShowsNotificationSettings.get(`${json[i].cleanTitle}-${json[i].imdbId}-${message.guild.id}`);
        }
			}
      else if (tvShowsNotificationSettings.guild == message.guild.id && tvShowsNotificationSettings.roleID === null && tvShowsNotificationSettings.exclude === null && tvShowsNotificationSettings.groupRole === null && tvShowsNotificationSettings.is_group === null && tvShowsNotificationSettings.groupName === null) {
        // Create a new role with data
				var role = await message.guild.roles.cache.find(role => role.name === json[i].title);

				if (role) {
					tvShowsNotificationSettings.roleID = role.id;
          client.setTvShowsNotificationSettings.run(tvShowsNotificationSettings);
					tvShowsNotificationSettings = client.getTvShowsNotificationSettings.get(`${json[i].cleanTitle}-${json[i].imdbId}-${message.guild.id}`);
				}
				else if (!roleLimitHit) {
					let newRole = await message.guild.roles.create({
						data: {
							name: json[i].title,
							color: 'BLUE',
							mentionable: true
						}
					})
						.then(role => {
							tvShowsNotificationSettings.roleID = role.id;
							client.setTvShowsNotificationSettings.run(tvShowsNotificationSettings);
							tvShowsNotificationSettings = client.getTvShowsNotificationSettings.get(`${json[i].cleanTitle}-${json[i].imdbId}-${message.guild.id}`);
						})
						.catch(function(error) {
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
      count++;
		}
		else {
			// Delete an Entry for the show in the database
			tvShowsNotificationSettings = client.getTvShowsNotificationSettings.get(`${json[i].cleanTitle}-${json[i].imdbId}-${message.guild.id}`);

			if (tvShowsNotificationSettings && tvShowsNotificationSettings.is_group === null && tvShowsNotificationSettings.include === null && tvShowsNotificationSettings.roleID != null) {
        if (await message.guild.roles.cache.find(role => role.id === tvShowsNotificationSettings.roleID) != null) {
          await message.guild.roles.cache.find(role => role.id === tvShowsNotificationSettings.roleID).delete()
  					.then(async () => {
  						tvShowsNotificationSettings.roleID = null;
  						tvShowsNotificationSettings.status = json[i].status;
  						client.setTvShowsNotificationSettings.run(tvShowsNotificationSettings);
  						tvShowsNotificationSettings = client.getTvShowsNotificationSettings.get(`${json[i].cleanTitle}-${json[i].imdbId}-${message.guild.id}`);
  					})
  					.catch(console.error);
        }
        else {
          tvShowsNotificationSettings.roleID = null;
          tvShowsNotificationSettings.status = json[i].status;
          client.setTvShowsNotificationSettings.run(tvShowsNotificationSettings);
          tvShowsNotificationSettings = client.getTvShowsNotificationSettings.get(`${json[i].cleanTitle}-${json[i].imdbId}-${message.guild.id}`);
        }
			}
			else if (tvShowsNotificationSettings && tvShowsNotificationSettings.is_group === null && tvShowsNotificationSettings.include != null && tvShowsNotificationSettings.roleID === null) {
				// Create a new role with data
				var role = await message.guild.roles.cache.find(role => role.name === json[i].title);

				if (role) {
					tvShowsNotificationSettings.roleID = role.id;
					client.setTvShowsNotificationSettings.run(tvShowsNotificationSettings);
					tvShowsNotificationSettings = client.getTvShowsNotificationSettings.get(`${json[i].cleanTitle}-${json[i].imdbId}-${message.guild.id}`);
				}
				else if (!roleLimitHit) {
					let newRole = await message.guild.roles.create({
						data: {
							name: json[i].title,
							color: 'BLUE',
							mentionable: true
						}
					})
						.then(role => {
							tvShowsNotificationSettings.roleID = role.id;
							client.setTvShowsNotificationSettings.run(tvShowsNotificationSettings);
							tvShowsNotificationSettings = client.getTvShowsNotificationSettings.get(`${json[i].cleanTitle}-${json[i].imdbId}-${message.guild.id}`);
						})
            .catch(function(error) {
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
			else if (!tvShowsNotificationSettings) {
				tvShowsNotificationSettings = { id: `${json[i].cleanTitle}-${json[i].imdbId}-${message.guild.id}`, guild: message.guild.id, title: json[i].title, cleanTitle: json[i].cleanTitle, sortTitle: json[i].sortTitle, imdbID_or_themoviedbID: json[i].imdbId, thetvdb_id: `${json[i].tvdbId}`, status: json[i].status, is_group: null, groupName: null, groupRole: null, exclude: null, include: null, network: json[i].network, completeSonarr: JSON.stringify(json[i]), roleID: null};
				client.setTvShowsNotificationSettings.run(tvShowsNotificationSettings);
				tvShowsNotificationSettings = client.getTvShowsNotificationSettings.get(`${json[i].cleanTitle}-${json[i].imdbId}-${message.guild.id}`);
			}
		}
	}
	return showsList;
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
		notificationSettings = { id: `${message.guild.id}-${client.user.id}-New Movies`, guild: message.guild.id, name: `New Movies`, category: `movies`, description: `Movies released within the last 9 months`, roleID: null };
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

async function updateReactRolesWhileOffline() {
  for (let previousNotifierList of client.searchPreviousNotifierList.iterate()) {
		var channelsWithRole = client.guilds.cache.get(previousNotifierList.guild).channels.cache.array();
		channelsWithRole.forEach(function(channel) {
      if (channel.type == "text") {
        channel.messages.fetch(`${previousNotifierList.messageID}`)
          .then(async message => {
            var emoji;
            var args = message.embeds[0].description.trim().split(/\r?\n/);
            for (var i = 0; i < args.length; i++){
              if (args[i].indexOf("<@&") === -1) return;       //Invalid React Role Mention Clicked

              var emojiKey = args[i].slice(0, args[i].indexOf("<@&")).trim();    //Grab Emoji
              var roleID = args[i].slice(args[i].indexOf("<@&") + 3, args[i].indexOf(">"));
              var reaction = message.reactions.cache.get(emojiKey);
              let reactions = await reaction.users.fetch();
              var roleList = [];  //List of users that are supposed to have that role

              await reactions.each(async user => {
                if (user.id != client.user.id) {
                  if (DEBUG == 3) console.log(`updateReactRolesWhileOffline -      User ID: ${user.id}    Username: ${user.username}    Role ID: ${roleID}    Emoji:   ${emojiKey}`);
                  roleList.push(user.id);

									await client.guilds.cache.get(previousNotifierList.guild).members.fetch(user.id)
									  .then(async member => {

											var userRole = await member.roles.cache.get(roleID);

											if (userRole === "" || userRole === null || userRole === undefined) {
												if (DEBUG == 3) console.log(`Adding role to ${user.username}:     RoleID: ${roleID}`);
											  let userToModify = message.guild.members.resolve(user.id);
											  userToModify.roles.add(roleID)
											    .catch(console.error);
											}
											else {
												if (DEBUG == 3)  {
													if (userRole.name) {
														console.log(`Role is already on ${user.username}: ${userRole.name}     ID: ${userRole.id}`);
													}
													else {
														console.log(`Name did not exist, role info is below:`);
														console.log(userRole.name);
													}
												}
											}
										});
                }
              });

              var roleUser = await client.guilds.cache.get(previousNotifierList.guild).roles.resolve(roleID).members.each(member => {
                var removeRole = true;
                for (var i = 0; i < roleList.length; i++) {
                  if (member.id == client.user.id || member.id == roleList[i]) {
                    removeRole = false;
                  }
                }
                if (removeRole) {
									if (DEBUG == 3) console.log(`Removing role from User: ${member.user.username}     ID: ${roleID}`);
                  let userToModify = message.guild.members.resolve(member.id);
                  userToModify.roles.remove(roleID)
                    .catch(console.error);
                }
              });
            }
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

module.exports.updateShowList = updateShowList;
module.exports.processHook = processHook;
module.exports.client = client;

process.on('SIGINT', function onSigint () {
  console.info('Got SIGTERM. Graceful shutdown start', new Date().toISOString())
  // start graceul shutdown here
  shutdown();
});

process.on('SIGTERM', function onSigterm () {
  console.info('Got SIGTERM. Graceful shutdown start', new Date().toISOString())
  // start graceul shutdown here
  shutdown();
});

function shutdown() {
  console.log('Received kill signal, shutting down gracefully');
  try {
    j.cancel();
	  sql.close();
  } catch (error) {
	  console.error(error);
	  process.exit(1);
  }

  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);

  process.exit();
}
