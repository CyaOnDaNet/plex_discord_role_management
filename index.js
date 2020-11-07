const Discord = require('discord.js');
const client = new Discord.Client({ partials: ['MESSAGE', 'REACTION'] });

const SQLite = require("better-sqlite3");
const schedule = require('node-schedule');
const fetch = require('node-fetch');
const process = require('process');
const isDocker = require('is-docker');
const fs = require('fs');

var DEBUG = 0;   // Ignored if defined in config or env variable, 1 for database debugging, 2 for sonarr instance debugging, 3 for startup role checking, 4 for tautulli connection logging

var configFile = null;
var config = {};
const tautulli = require('./src/tautulli.js');
const Sonarr = require('./src/sonarr.js');
const sql = new SQLite('./config/database.sqlite');
var pjson = require('./package.json');

// Exported Functions
const databaseSetup = require('./src/functions/databaseSetup.js');
const generateNotificationSettings = require('./src/functions/generateNotificationSettings.js');
const updateReactRolesWhileOffline = require('./src/functions/updateReactRolesWhileOffline.js');
const unenrollFromReactRoleList = require('./src/functions/unenrollFromReactRoleList.js');
const checkForVersionChanges = require('./src/functions/checkForVersionChanges.js');

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

// Other Global Variables
var undefinedStreamers = [];
var online = false;
var exemptEmbedReactRoles = [];
var numberOfActiveUsers = "0";
var setActivityToggle = 0;
var failed2StartCount = 0;
var runOnce = {};

const defaultGuildSettings = {
  prefix: config.defaultPrefix,
  logChannel: "",
  logChannelBoolean: "off",
  notificationChannel: "",
  notificationChannelBoolean: "off",
  adminRole: "",
  watchingRole: "",
	customRoleCount: 0,
	changelogChannel: "",
	changelogChannelBoolean: "off",
	recentlyAddedBoolean: "on",
	botVersion: pjson.version,
	listCreationActive: "off"
}

client.login(config.botToken);

client.on('ready', async ()=> {
  client.user.setActivity('Plex | ' + defaultGuildSettings.prefix + 'help', { type: 'WATCHING' });

  var backupLocation = './config/backups/database/';
  var databaseBotVersion = 'unknown_version';
	const tableGuildSettings = sql.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'guildSettings';").get();

	if (tableGuildSettings['count(*)']) {
    // Table exists, we need to check for necessary changes and apply them on startup.
    const tableInfo = sql.pragma('table_info(guildSettings)', { simple: false });
    var nameList = [];
    for (let i = 0; i < tableInfo.length; i++) {
      nameList.push(tableInfo[i].name);
    }

    if (nameList.indexOf("botVersion") != -1) {
			for (const guildSettings of sql.prepare("SELECT * FROM guildSettings").iterate()) {
				guildSettings.logChannelBoolean === "on"
				databaseBotVersion = `v${guildSettings.botVersion}`;
				break;
			}
    }

		if (!fs.existsSync(`${backupLocation}${databaseBotVersion}/`)) {
			process.umask(0);    // Needed to set permissions properly in new folder
	    fs.mkdirSync(`${backupLocation}${databaseBotVersion}/`, { recursive: true });
	  }

	  sql.backup(`${backupLocation}${databaseBotVersion}/database-${databaseBotVersion}.sqlite`)
	  .then(() => {
	    if (DEBUG == 1) console.log('Database backup complete!');
	    finishSetup();
	  })
	  .catch((err) => {
	    console.log('Database backup failed:', err);
	    finishSetup();
	  });
  }
	else {
		// First runtime, no database exists.
		finishSetup();
	}

	async function finishSetup() {
		await databaseSetup(client, sql);
		client.newNotificationListAuthorName = `⚠️ New Notification List ⚠️`;

	  online = true;
		await checkForVersionChanges(); //Check For New Version Change and Trigger any notifications.

	  const tautulliService = await tautulli(config, config.node_hook_port); // start the tautulli webhook service

		updateNumberOfActiveUsers(); // Update numberOfActiveUsers variable with proper Stream Count

	  updateReactRolesWhileOffline(true, false, false); // Update all react roles while bot was offline

		console.log('The bot is now online!');
	}
});

client.on('message', async message => {
  if (message.author.bot) return;
  let guildSettings;

  if (message.guild) {
    // Sets default server settings
    guildSettings = client.getGuildSettings.get(message.guild.id);
    if (!guildSettings) {
      guildSettings = { id: `${message.guild.id}-${client.user.id}`, guild: message.guild.id, prefix: defaultGuildSettings.prefix, logChannel: defaultGuildSettings.logChannel, logChannelBoolean: defaultGuildSettings.logChannelBoolean, notificationChannel: defaultGuildSettings.notificationChannel, notificationChannelBoolean: defaultGuildSettings.notificationChannelBoolean, adminRole: defaultGuildSettings.adminRole, watchingRole: defaultGuildSettings.watchingRole, customRoleCount: defaultGuildSettings.customRoleCount, changelogChannel: defaultGuildSettings.changelogChannel, changelogChannelBoolean: defaultGuildSettings.changelogChannelBoolean, recentlyAddedBoolean: defaultGuildSettings.recentlyAddedBoolean, botVersion: defaultGuildSettings.botVersion, listCreationActive: defaultGuildSettings.listCreationActive };
      client.setGuildSettings.run(guildSettings);
      guildSettings = client.getGuildSettings.get(message.guild.id);
    }

    if (!runOnce[message.guild.id]) {
      generateNotificationSettings(message, client);
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

// To prevent crashing, lets catch all events we can. I'm unsure if it works yet, but in theory the bot should survive a discord outage now. <- Added in Bot v2.0.0
client.on("error", (e) => {
	if (e.code && e.code == "ETIMEDOUT") {
		console.log("Discord Servers are unreachable!");
	}
	else {
		console.log("Unknown discord client error was thrown, below is the output:")
		console.error(e);
	}
});
client.on("warn", (e) => {
	//console.warn(e)
});
client.on("debug", (e) => {
	//console.info(e)
});

var setActivity = schedule.scheduleJob('*/10 * * * * *', async function() {
	// Change the Status every 10 seconds.
	if (!client || !online) {
		if (DEBUG != 0) console.log("Client not ready yet, activity update was skipped.");
		return;
	}
	if (setActivityToggle == 0) {
		client.user.setActivity('Plex | ' + defaultGuildSettings.prefix + 'help', { type: 'WATCHING' });
		setActivityToggle++;
	}
	else if (setActivityToggle == 1) {
		client.user.setActivity('Plex | ' + numberOfActiveUsers + ' online', { type: 'WATCHING' });
		setActivityToggle++;
	}
	else if (setActivityToggle == 2) {
		client.user.setActivity('Plex | Bot v' + pjson.version, { type: 'WATCHING' });
		setActivityToggle = 0;
	}
	else {
		setActivityToggle = 0; // just in case the variable gets changed to something it shouldn't
	}
});

var runningDatabaseBackup = schedule.scheduleJob('0 */8 * * *', async function() {
	// Backup the Database every 8 hours and delete any excess files.
	var backupLocation = './config/backups/database/scheduled_backups/';
	var maxNumBackups = 21; // enough backups to equal 7 days worth.

	if (!fs.existsSync(`${backupLocation}`)) {
		process.umask(0);    // Needed to set permissions properly in new folder
		fs.mkdirSync(`${backupLocation}`, { recursive: true });
	}

	sql.backup(`${backupLocation}${Date.now()}.sqlite`)
	.then(() => {
		if (DEBUG == 1) console.log(`Scheduled Database Job - Save was successfull. Completed at ${Date.now()}.`);

		var files = fs.readdirSync(backupLocation);
		var fileNames = [];

		for (var i = 0; i < files.length; i++) {
			if (files[i].indexOf(`.sqlite`) != -1) {
				var timeStamp = files[i].slice(0, files[i].indexOf(`.sqlite`));
				fileNames.push(timeStamp);
			}
		}
		fileNames.sort((a, b) => b - a); // Sort file names numerically in descending order to delete oldest ones later

		if (files.length > maxNumBackups) {
			for (var i = ( files.length - 1 ); i >= maxNumBackups; i--) {
        fs.unlink(`${backupLocation}${fileNames[i]}.sqlite`, (err) => {
					// File deleted
					if (DEBUG == 1) console.log(`Scheduled Database Job - File ${fileNames[i]}.sqlite was deleted successfuly.`);
          if (err) {
						console.log('Could not delete old backup file for reason:');
            console.error(err);
            return;
          }
        });
			}
		}

	})
	.catch((err) => {
		console.log('Scheduled database save failed:', err);
	});

});

var tautulliCheck = schedule.scheduleJob('0 */2 * * * *', async function() {
  // Checks the plex server for activity using Tautulli and repeats every 2 minutes, serves as a fallback in the event webhook trigger has failed.

	if (online === false) {
		failed2StartCount++;
		if (failed2StartCount > 5) shutdown(); // I am unsure what causes this but sometimes discord client never becomes ready. To ensure we don't get stuck here, shutdown after 5 failed attempts.
    console.log("Database not ready for scheduled job, client not fully online yet. Waiting to try again...");
		return;
	}
	var result = await tautulli.tautulliService.getActivity();
	if (result && result.error) {
		if (result.error == true) {
			if (result.moreInfo && result.moreInfo != "") {
				if (result.moreInfo == "Unestablished Connection with Tautulli") {
					// Do nothing, we are waiting for connection to be established.
					return;
				}
				else {
					console.log(`~Scheduled Watching Check Failed!~ Failed to connect to Tautulli with reason given as: ${result.moreInfo}`);
					return;
				}
			}
			else {
				console.log("~Scheduled Watching Check Failed!~ Couldn't connect to Tautulli, check your settings.");
				return;
			}
		}
	}
	if (result && result.data && result.data.stream_count && result.data.sessions) {
		// Valid result
	}
	else {
		// Invalid result
		console.log("~Scheduled Watching Check Failed!~ Invalid result received from Tautulli. If this error continues, check your settings. Below is the info received: ");
		console.log(result);
		return;
	}

	numberOfActiveUsers = result.data.stream_count; // Update Stream Count

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

            if (userToModify === undefined || userToModify === null) {
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

          if (userToModify === undefined || userToModify === null) {
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
	let guildSettings = client.getGuildSettings.get(message.guild.id);

	if (client.user.id != message.author.id) return; //Only continue if react was to a message by this bot.
	if (message.embeds[0] === undefined || message.embeds[0] === null) return; //Only continue if react was to a message embed.
	if (client.user.id === user.id) return; //Ignore the bot setting up react roles so it doesnt add roles to itself.

	if (message.embeds[0].author) {
		if (message.embeds[0].author.name === `⚠️ New Notification List ⚠️`) {
			if (reaction.emoji.name === '❌') {
				// Clear Users Roles.
				if (DEBUG == 3) console.log(`${user.username} clicked the ❌ emoji`);
				if (guildSettings && guildSettings.listCreationActive && guildSettings.listCreationActive == "on") {
					// a new list is being generated, doing something now could jeopardize things so we will skip calling unenrollFromReactRoleList();
					// we will call updateReactRolesWhileOffline() after the list is generated to account for any changes here.
				}
				else {
					await unenrollFromReactRoleList(message);
				}
				return;
			}
		}
	}

	for (let exemptNames of exemptEmbedReactRoles) {
		//return if an embed was called that needed emoji response to prevent accidentally trying to react role
		if (message.embeds[0].author) {
		  if (message.embeds[0].author.name === exemptNames) return;
		}
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

			let inactiveDatabaseCheck = await client.getNewListInactiveUsers.get(`${message.guild.id}-${user.id}`);
			if (inactiveDatabaseCheck === undefined || inactiveDatabaseCheck === "" || inactiveDatabaseCheck === null) {
				// user not in database so create entry
				inactiveDatabaseCheck = { id: `${message.guild.id}-${user.id}`, guild: `${message.guild.id}`, discordUserID: `${user.id}`, inactive: `false`, wipeRoleReactions: `false` };
				client.setNewListInactiveUsers.run(inactiveDatabaseCheck);
			}
			else if (inactiveDatabaseCheck.inactive == "true") {
				if (guildSettings && guildSettings.listCreationActive && guildSettings.listCreationActive == "on") {
					// a new list is being generated, doing something now could jeopardize things so we will skip calling updateReactRolesWhileOffline()
					// we will call updateReactRolesWhileOffline() after the list is generated to account for any changes here.
					inactiveDatabaseCheck.inactive = "false";
					inactiveDatabaseCheck.wipeRoleReactions = "false";
					client.setNewListInactiveUsers.run(inactiveDatabaseCheck);
				}
				else {
					inactiveDatabaseCheck.inactive = "false";
					inactiveDatabaseCheck.wipeRoleReactions = "false";
					client.setNewListInactiveUsers.run(inactiveDatabaseCheck);
					updateReactRolesWhileOffline(false, false, false); // remove roles from old list
				}
			}
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
	if (client.user.id === user.id) return; //Ignore the bot setting up react roles so it doesnt add roles to itself.

	for (let exemptNames of exemptEmbedReactRoles) {
		//return if an embed was called that needed emoji response to prevent accidentally trying to react role
		if (message.embeds[0].author) {
		  if (message.embeds[0].author.name === exemptNames) return;
		}
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

			let inactiveDatabaseCheck = await client.getNewListInactiveUsers.get(`${message.guild.id}-${user.id}`);
			if (inactiveDatabaseCheck === undefined || inactiveDatabaseCheck === "" || inactiveDatabaseCheck === null) {
				// user not in database so create entry
				inactiveDatabaseCheck = { id: `${message.guild.id}-${user.id}`, guild: `${message.guild.id}`, discordUserID: `${user.id}`, inactive: `false`, wipeRoleReactions: `false` };
				client.setNewListInactiveUsers.run(inactiveDatabaseCheck);
			}
			else if (inactiveDatabaseCheck.inactive == "true" && inactiveDatabaseCheck.wipeRoleReactions != "true") {
				if (guildSettings && guildSettings.listCreationActive && guildSettings.listCreationActive == "on") {
					// a new list is being generated, doing something now could jeopardize things so we will skip calling updateReactRolesWhileOffline()
					// we will call updateReactRolesWhileOffline() after the list is generated to account for any changes here.
					inactiveDatabaseCheck.inactive = "false";
					inactiveDatabaseCheck.wipeRoleReactions = "false";
					client.setNewListInactiveUsers.run(inactiveDatabaseCheck);
				}
				else {
					inactiveDatabaseCheck.inactive = "false";
					inactiveDatabaseCheck.wipeRoleReactions = "false";
					client.setNewListInactiveUsers.run(inactiveDatabaseCheck);
					updateReactRolesWhileOffline(false, false, false); // remove roles from old list
				}
			}
		}
	}
});

async function updateNumberOfActiveUsers() {
	// Update numberOfActiveUsers variable
	var result = await tautulli.tautulliService.getActivity();
	if (result && result.error) {
		if (result.error == true) {
			if (result.moreInfo && result.moreInfo != "") {
				if (result.moreInfo == "Unestablished Connection with Tautulli") {
					// Do nothing, we are waiting for connection to be established.
					return;
				}
				else {
					console.log(`~numberOfActiveUsers Update Failed!~ Failed to connect to Tautulli with reason given as: ${result.moreInfo}`);
					return;
				}
			}
			else {
				console.log("~numberOfActiveUsers Update Failed!~ Couldn't connect to Tautulli, check your settings.");
				return;
			}
		}
	}
	numberOfActiveUsers = result.data.stream_count; // Update Stream Count
}

// Exports
module.exports.updateNumberOfActiveUsers = updateNumberOfActiveUsers;
module.exports.client = client;
module.exports.sonarr = sonarr;
module.exports.DEBUG = DEBUG;
module.exports.undefinedStreamers = undefinedStreamers;

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
  console.info('Received kill signal, shutting down gracefully');
  try {
		setActivity.cancel();
    tautulliCheck.cancel();
		runningDatabaseBackup.cancel();

		var backupLocation = './config/backups/database/';
	  var databaseBotVersion = 'unknown_version';
		const tableGuildSettings = sql.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'guildSettings';").get();

		if (tableGuildSettings['count(*)']) {
	    // Table exists, we need to check for necessary changes and apply them on startup.
	    const tableInfo = sql.pragma('table_info(guildSettings)', { simple: false });
	    var nameList = [];
	    for (let i = 0; i < tableInfo.length; i++) {
	      nameList.push(tableInfo[i].name);
	    }

	    if (nameList.indexOf("botVersion") != -1) {
				for (const guildSettings of sql.prepare("SELECT * FROM guildSettings").iterate()) {
					guildSettings.logChannelBoolean === "on"
					databaseBotVersion = `v${guildSettings.botVersion}`;
					break;
				}
	    }

			if (!fs.existsSync(`${backupLocation}${databaseBotVersion}/`)) {
				process.umask(0);    // Needed to set permissions properly in new folder
		    fs.mkdirSync(`${backupLocation}${databaseBotVersion}/`, { recursive: true });
		  }

		  sql.backup(`${backupLocation}${databaseBotVersion}/database-${databaseBotVersion}.sqlite`)
		  .then(() => {
				sql.close();
		    console.log('Database was closed and saved successfully. Shutting down now.');
				console.log('');

				setTimeout(() => {
			    console.error('Could not close connections in time, forcefully shutting down');
					console.log('');
			    process.exit(1);
			  }, 10000);
			  process.exit();

		  })
		  .catch((err) => {
		    console.log('Database save failed:', err);
				console.log('');
		    sql.close();

				setTimeout(() => {
			    console.error('Could not close connections in time, forcefully shutting down.');
					console.log('');
			    process.exit(1);
			  }, 10000);
			  process.exit();

		  });
	  }
		else {
			console.log('Database structure seems invalid! Does the database exist?');
			sql.close();

			setTimeout(() => {
				console.error('Could not close connections in time, forcefully shutting down.');
				console.log('');
				process.exit(1);
			}, 10000);
			process.exit();
		}
  } catch (error) {
	  console.error(error);
	  process.exit(1);
  }
}
