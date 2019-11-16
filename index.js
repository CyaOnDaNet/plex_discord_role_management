const Discord = require('discord.js');
const client = new Discord.Client();
const config = require("./config/config.json");
const SQLite = require("better-sqlite3");
const sql = new SQLite('./config/database.sqlite');
const schedule = require('node-schedule');
const Tautulli = require('tautulli-api');
const fetch = require('node-fetch');

const DEBUG = 0;

const defaultGuildSettings = {
  prefix: config.defaultPrefix,
  logChannel: "plex_watching_logs",
  logChannelBoolean: "off",
  adminRole: "Admin",
  watchingRole: "Watching Plex"
}

client.login(config.botToken);
var tautulli = new Tautulli(config.tautulli_ip, config.tautulli_port, config.tautulli_api_key); // ip and port of Tautulli and YOUR Tautulli API token

client.on('ready', ()=> {
  console.log('The bot is now online!');
  client.user.setActivity('Plex | ' + defaultGuildSettings.prefix, { type: 'WATCHING' })

  // Check if the table "guildSettings" exists.
  const tableGuildSettings = sql.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'guildSettings';").get();
  if (!tableGuildSettings['count(*)']) {
    // If the table isn't there, create it and setup the database correctly.
    sql.prepare("CREATE TABLE guildSettings (id TEXT PRIMARY KEY, guild TEXT, prefix TEXT, logChannel TEXT, logChannelBoolean TEXT, adminRole TEXT, watchingRole TEXT);").run();
    // Ensure that the "id" row is always unique and indexed.
    sql.prepare("CREATE UNIQUE INDEX idx_guildSettings_id ON guildSettings (id);").run();
    sql.pragma("synchronous = 1");
    sql.pragma("journal_mode = wal");
  }

  // And then we have prepared statements to get and set guildSettings data.
  client.getGuildSettings = sql.prepare("SELECT * FROM guildSettings WHERE guild = ?");
  client.setGuildSettings = sql.prepare("INSERT OR REPLACE INTO guildSettings (id, guild, prefix, logChannel, logChannelBoolean, adminRole, watchingRole) VALUES (@id, @guild, @prefix, @logChannel, @logChannelBoolean, @adminRole, @watchingRole);");

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
});

client.on('message', async message => {
  if (message.author.bot) return;
  let guildSettings;

  if (message.guild) {
    // Sets default server settings
    guildSettings = client.getGuildSettings.get(message.guild.id);
    if (!guildSettings) {
      guildSettings = { id: `${message.guild.id}-${client.user.id}`, guild: message.guild.id, prefix: defaultGuildSettings.prefix, logChannel: defaultGuildSettings.logChannel, logChannelBoolean: defaultGuildSettings.logChannelBoolean, adminRole: defaultGuildSettings.adminRole, watchingRole: defaultGuildSettings.watchingRole };
      client.setGuildSettings.run(guildSettings);
      guildSettings = client.getGuildSettings.get(message.guild.id);
    }
  }

  var prefix = guildSettings.prefix;

  if (!message.content.startsWith(prefix)) return;

  var args = message.content.slice(prefix.length).trim().split(/ +/g);
  var command = args.shift().toLowerCase();

  if (command === "bot") {
  // This is where we change bot information
    if (args.length > 0) {
      command = args.shift().toLowerCase();
    } else {
      command = "help";
    }

    if (command === "settings") {
      embed = new Discord.RichEmbed()
        .setAuthor(client.user.username, client.user.avatarURL)
        .setDescription("Below is a list of bot settings\n")
        .addField("Prefix: ", '`' + prefix + '`',  true)
        .addField("Watching Role: ", '<@&' + guildSettings.watchingRole + '>')
        .addField("Log Channel: ", '<#' + guildSettings.logChannel + '>')
        .setFooter("Fetched")
        .setTimestamp(new Date())
        .setColor(0x00AE86);

      if (guildSettings.logChannelBoolean === "off") {
        embed.addField("Logging Status: ", '**Disabled**');
      }
      else if (guildSettings.logChannelBoolean === "on") {
        embed.addField("Logging Status: ", '**Enabled**');
      }
      message.channel.send({embed});
    }
    else if (command === "prefix") {
      if (args.length > 0) {
        if (message.channel.guild.member(message.author).hasPermission('ADMINISTRATOR')) {
          command = args.shift().toLowerCase();
          guildSettings.prefix = command;
          client.setGuildSettings.run(guildSettings);
          guildSettings = client.getGuildSettings.get(message.guild.id);
          message.channel.send("Prefix changed to `" + guildSettings.prefix + "`");
        }
        else {
          return message.channel.send('You do not have permissions to use `' + prefix + 'bot prefix` in <#' + message.channel.id + '>!');
        }
      } else {
        return message.channel.send("The current prefix is `" + guildSettings.prefix + "`\nTo change it type: `" + guildSettings.prefix + "bot prefix ??` (where *??* is the prefix)");
      }
    }
    else if (command === "logchannel") {
      if (args.length > 0) {
        let mentionedChannel = message.mentions.channels.first();
        if(!mentionedChannel) {
          command = args.shift().toLowerCase();
          if (command === "off") {
            // disable logChannel
            guildSettings.logChannelBoolean = "off";
            client.setGuildSettings.run(guildSettings);
            guildSettings = client.getGuildSettings.get(message.guild.id);
            message.channel.send("Logging disabled!");
          } else {
            return message.channel.send("You did not specify a valid channel to set the log channel to!");
          }
        }
        else if (message.channel.guild.member(message.author).hasPermission('ADMINISTRATOR')) {
          guildSettings.logChannel = mentionedChannel.id;
          guildSettings.logChannelBoolean = "on";
          client.setGuildSettings.run(guildSettings);
          guildSettings = client.getGuildSettings.get(message.guild.id);
          message.channel.send("Log channel changed to <#" + guildSettings.logChannel + ">!");
        } else {
          return message.channel.send('You do not have permissions to use `' + prefix + 'bot logchannel` in <#' + message.channel.id + '>!');
        }
      } else {
        return message.channel.send("The current log channel is <#" + guildSettings.logChannel + ">!\nTo change it type: `" + guildSettings.prefix + "bot logchannel #logs` (where **#logs** is the desired channel)\nTo disable it type: `" + guildSettings.prefix + "bot logchannel off`");
      }
    }
    else if (command === "help") {
      // help message goes here
    }
  }
  else if (command === "link") {
    if (message.channel.guild.member(message.author).hasPermission('ADMINISTRATOR')) {
      // link a discord user and plex user
      let mentionedUser = message.mentions.users.first();
      if(!mentionedUser) {
        return message.channel.send("You did not specify a valid user to link!");
      }
      var plexUserName = message.content.slice(message.content.indexOf(mentionedUser.id) + mentionedUser.id.length + 1).trim();
      let userList = client.getLinkByDiscordUserID.get(mentionedUser.id);

      if (!userList) {
        userList = { id: `${message.guild.id}-${client.user.id}-${mentionedUser.id}`, guild: message.guild.id, discordUserID: mentionedUser.id, plexUserName: plexUserName, watching: "false" };
        client.setUserList.run(userList);
        userList = client.getLinkByDiscordUserID.get(mentionedUser.id);
      }
      else {
        userList.plexUserName = plexUserName;
        client.setUserList.run(userList);
        userList = client.getLinkByDiscordUserID.get(mentionedUser.id);
      }

      message.channel.send('Succesfully linked **' + mentionedUser.username + '** as Plex user: `' + plexUserName + '`');

    } else {
      return message.channel.send('You do not have permissions to use `' + prefix + 'link`!');
    }
  }
  else if (command === "unlink") {
    if (message.channel.guild.member(message.author).hasPermission('ADMINISTRATOR')) {
      // link a discord user and plex user
      let mentionedUser = message.mentions.users.first();
      if(!mentionedUser) {
        return message.channel.send("You did not specify a valid user to link!");
      }
      let userList = client.getLinkByDiscordUserID.get(mentionedUser.id);

      if (!userList) {
        userList = { id: `${message.guild.id}-${client.user.id}-${mentionedUser.id}`, guild: message.guild.id, discordUserID: mentionedUser.id, plexUserName: null, watching: "false" };
        client.setUserList.run(userList);
        userList = client.getLinkByDiscordUserID.get(mentionedUser.id);
      }
      else {
        userList.plexUserName = null;
        client.setUserList.run(userList);
        userList = client.getLinkByDiscordUserID.get(mentionedUser.id);
      }

      message.channel.send('Succesfully unlinked **' + mentionedUser.username + '** from a Plex account.');

    } else {
      return message.channel.send('You do not have permissions to use `' + prefix + 'unlink`!');
    }
  }
  else if (command === "role" || command === "watchingrole" || command === "watching role") {
    if (message.channel.guild.member(message.author).hasPermission('ADMINISTRATOR')) {
      // link a discord user and plex user
      let mentionedRole = message.mentions.roles.first();
      if(!mentionedRole) {
        return message.channel.send("You did not specify a valid role for watching assignment!");
      } else {
        guildSettings.watchingRole = mentionedRole.id;
        client.setGuildSettings.run(guildSettings);
        guildSettings = client.getGuildSettings.get(message.guild.id);
        message.channel.send("The watching role was succesfully set to <@&" + guildSettings.watchingRole + ">");
      }
    } else {
      return message.channel.send('You do not have permissions to use `' + prefix + command + '`!');
    }
  }
  else if (command === "linklist") {
    if (!message.channel.guild.member(message.author).hasPermission('ADMINISTRATOR')) {
      return message.channel.send('You do not have permissions to use `' + prefix + command + '`! It contains sensitive information.');
    }
    embed = new Discord.RichEmbed()
      .setAuthor(client.user.username, client.user.avatarURL)
      .setDescription("Below is a list of linked Discord-Plex accounts:\n\n")
      .setFooter("Fetched")
      .setTimestamp(new Date())
      .setColor(0x00AE86);

    for (const linkQuery of client.searchGuildUserList.iterate()) {
      if (linkQuery.guild === message.guild.id && linkQuery.plexUserName != null) {
        embed.addField(linkQuery.plexUserName,'is linked to: <@' + linkQuery.discordUserID + '>',  true);
      }
    }
    message.channel.send({embed});
  }
  else if (command === "users") {
    if (!message.channel.guild.member(message.author).hasPermission('ADMINISTRATOR')) {
      return message.channel.send('You do not have permissions to use `' + prefix + command + '`! It contains sensitive information.');
    }

    tautulli.get('get_users').then((result) => {
      var users = result.response.data;
      var userList = "\n";
      for (var i = 0; i < users.length; i++) {
        userList = userList + "> " + users[i].username + "\n";
      }

      embed = new Discord.RichEmbed()
        .setAuthor(client.user.username, client.user.avatarURL)
        .setDescription("Below is a list of users with access to the Plex Server:\n" + userList)
        .setFooter("Fetched")
        .setTimestamp(new Date())
        .setColor(0x00AE86);
      message.channel.send({embed});
    }).catch((error) => {
      console.log("Couldn't connect to Tautulli, check your settings.");
      console.log(error);
      // do we need to remove roles if this is the case? Maybe we don't...
    });

  }
  else if (command === "test") {
    tautulli.get('get_library_media_info').then((result) => {
      console.log(result.response.data);
      console.log(result);
    }).catch((error) => {
      console.log("Couldn't connect to Tautulli, check your settings.");
      console.log(error);
      // do we need to remove roles if this is the case? Maybe we don't...
    });
  }
});

var j = schedule.scheduleJob('*/30 * * * * *', function() {
  // Checks the plex server for activity using Tautulli and repeats every 30 seconds
  let userList;

  tautulli.get('get_activity').then((result) => {

    var activeStreams = result.response.data.sessions;
    if (activeStreams.length === 0) {
      // Make sure nobody has the watching role
    }
    else {
      for (var i = 0; i < activeStreams.length; i++) {
        userList = client.getLinkByPlexUserName.get(`${activeStreams[i].user}`);
        if (userList === undefined) {
          // No record of plex username exists in database; therefore it has not been setup and we do nothing.
        } else {
          // This is where we assign the watching role
          let guildSettings = client.getGuildSettings.get(userList.guild);
          userList.watching = "true";
          client.setUserList.run(userList);
          userList = client.getLinkByPlexUserName.get(`${activeStreams[i].user}`);

          let userToModify = client.guilds.get(userList.guild).members.get(userList.discordUserID);

          var bypass = false;
          var roles = userToModify._roles;

          for (var i = 0; i < roles.length; i++) {
            if (roles[i] === guildSettings.watchingRole) {
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
  }).catch((error) => {
    console.log("Couldn't connect to Tautulli, check your settings.");
    console.log(error);
    // do we need to remove roles if this is the case? Maybe we don't...
  });
});
