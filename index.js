const Discord = require('discord.js');
const client = new Discord.Client();
const config = require("./config/config.json");
const SQLite = require("better-sqlite3");
const sql = new SQLite('./config/database.sqlite');
const schedule = require('node-schedule');
const Tautulli = require('tautulli-api');

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

  // Check if the table "userLinkList" exists.
  const tableUserLinkList = sql.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'userLinkList';").get();
  if (!tableUserLinkList['count(*)']) {
    // If the table isn't there, create it and setup the database correctly.
    sql.prepare("CREATE TABLE userLinkList (id TEXT PRIMARY KEY, guild TEXT, discordUserID TEXT, plexUserName TEXT);").run();
    // Ensure that the "id" row is always unique and indexed.
    sql.prepare("CREATE UNIQUE INDEX idx_userLinkList_id ON userLinkList (id);").run();
    sql.pragma("synchronous = 1");
    sql.pragma("journal_mode = wal");
  }

  // And then we have prepared statements to get and set userLinkList data.
  client.getGuildUserLinkList = sql.prepare("SELECT * FROM userLinkList WHERE guild = ?");
  client.getLinkByDiscordUserID = sql.prepare("SELECT * FROM userLinkList WHERE discordUserID = ?");
  client.getLinkByPlexUserName = sql.prepare("SELECT * FROM userLinkList WHERE plexUserName = ?");
  client.setUserLinkList = sql.prepare("INSERT OR REPLACE INTO userLinkList (id, guild, discordUserID, plexUserName) VALUES (@id, @guild, @discordUserID, @plexUserName);");
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

    if (command === "prefix") {
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
      let userLinkList = client.getLinkByDiscordUserID.get(mentionedUser.id);

      if (!userLinkList) {
        userLinkList = { id: `${message.guild.id}-${client.user.id}`, guild: message.guild.id, discordUserID: mentionedUser.id, plexUserName: plexUserName };
        client.setUserLinkList.run(userLinkList);
        userLinkList = client.getLinkByDiscordUserID.get(mentionedUser.id);
      }
      else {
        userLinkList.plexUserName = plexUserName;
        client.setUserLinkList.run(userLinkList);
        userLinkList = client.getLinkByDiscordUserID.get(mentionedUser.id);
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
      let userLinkList = client.getLinkByDiscordUserID.get(mentionedUser.id);

      if (!userLinkList) {
        userLinkList = { id: `${message.guild.id}-${client.user.id}`, guild: message.guild.id, discordUserID: mentionedUser.id, plexUserName: null };
        client.setUserLinkList.run(userLinkList);
        userLinkList = client.getLinkByDiscordUserID.get(mentionedUser.id);
      }
      else {
        userLinkList.plexUserName = null;
        client.setUserLinkList.run(userLinkList);
        userLinkList = client.getLinkByDiscordUserID.get(mentionedUser.id);
      }

      message.channel.send('Succesfully unlinked **' + mentionedUser.username + '** from a Plex account.');

    } else {
      return message.channel.send('You do not have permissions to use `' + prefix + 'unlink`!');
    }
  }
});

var j = schedule.scheduleJob('*/30 * * * * *', function() {
  // Checks the plex server for activity using Tautulli and repeats every 30 seconds
  //console.log(new Date());
  let userLink;

  tautulli.get('get_activity').then(function(res) {
    //console.log(res);
    //console.log(res.response.data.sessions);

    var activeStreams = res.response.data.sessions;
    if (activeStreams.length === 0) {
      // Make sure nobody has the watching role
    }
    else {
      for (var i = 0; i < activeStreams.length; i++) {
        //console.log(activeStreams[i].user);
        userLink = client.getLinkByPlexUserName.get(`${activeStreams[i].user}`);
        if (userLink === undefined) {
          // No record of plex username exists in database; therefore it has not been setup and we do nothing.
        } else {
          // This is where we assign the watching role
          //console.log(userLink);
        }
      }
    }
  });
});
