var pjson = require('../package.json');

module.exports = {
	name: 'bot',
	description: 'Bot Settings that can be configured',
	usage: '[subcommand]',
	adminCommand: true,
	subcommands: {
		'info':'',
		'prefix':'newprefix',
		'recentlyadded':'`on` or `off` to enable recently added role creation'
	},
	async execute(message, args, prefix, guildSettings, client, Discord, config, fetch, exemptEmbedReactRoles, tautulli, sonarr) {
    // This is where we change bot information
    if (args.length > 0) {
      command = args.shift().toLowerCase();
    } else {
			command = "info";
      //command = "help";
    }

    if (command === "info" || command === "information") {
      embed = new Discord.MessageEmbed()
        .setAuthor(client.user.username, client.user.displayAvatarURL())
        .setDescription("Below is a list of important bot info:\n")
				.addField("Bot Version: ", `\`${pjson.version}\``, true)
        .addField("Prefix: ", '`' + prefix + '`',  true)
        .setFooter("Fetched")
        .setTimestamp(new Date())
        .setColor(0x00AE86);

			if (guildSettings.watchingRole === "" || guildSettings.watchingRole === undefined || guildSettings.watchingRole === null) {
				embed.addField("Watching Role: ", "**Not Set**");
			}
			else {
				embed.addField("Watching Role: ", '<@&' + guildSettings.watchingRole + '>');
			}

      if (guildSettings.logChannelBoolean === "off") {
        embed.addField("Logging Status: ", '**Disabled**');
      }
      else if (guildSettings.logChannelBoolean === "on") {
        embed.addField("Logging Status: ", '**Enabled**');
				embed.addField("Log Channel: ", '<#' + guildSettings.logChannel + '>');
      }

			if (guildSettings.notificationChannelBoolean === "off") {
        embed.addField("Content Notifying Status: ", '**Disabled**');
      }
      else if (guildSettings.notificationChannelBoolean === "on") {
        embed.addField("Content Notifying Status: ", '**Enabled**');
				embed.addField("Content Notifications Channel: ", '<#' + guildSettings.notificationChannel + '>');
      }

			if (guildSettings.recentlyAddedBoolean === "off") {
				embed.addField("Recently Added Shows Role Creation: ", '**Disabled**');
			}
			else if (guildSettings.recentlyAddedBoolean === "on") {
				embed.addField("Recently Added Role Creation: ", '**Enabled**');
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
			return message.channel.send(`This command has moved to \`${prefix}notify.\``);
    }
		else if (command === "recentlyadded") {
			if (args.length > 0) {
        if (message.channel.guild.member(message.author).hasPermission('ADMINISTRATOR')) {
          command = args.shift().toLowerCase();
					if (command == "on") {
						guildSettings.recentlyAddedBoolean = "on";
	          client.setGuildSettings.run(guildSettings);
	          guildSettings = client.getGuildSettings.get(message.guild.id);
	          return message.channel.send("Recently added role creation was enabled!");
					}
					else if (command == "off") {
						guildSettings.recentlyAddedBoolean = "off";
	          client.setGuildSettings.run(guildSettings);
	          guildSettings = client.getGuildSettings.get(message.guild.id);
	          return message.channel.send("Recently added role creation was disabled!");
					}
					else {
						return message.channel.send("That command was invalid! Try again using the following format: \n`" + guildSettings.prefix + "bot recentlyAddedBoolean on/off` (where *on/off* is an option of either **on** or **off**)");
					}
        }
        else {
          return message.channel.send('You do not have permissions to use `' + prefix + 'bot recentlyadded` in <#' + message.channel.id + '>!');
        }
      } else {
				if (guildSettings.recentlyAddedBoolean == "off") return message.channel.send("Recently added role creation is `" + guildSettings.recentlyAddedBoolean + "`\nTo change it type: `" + guildSettings.prefix + "bot recentlyAddedBoolean on`");
				else if (guildSettings.recentlyAddedBoolean == "on") return message.channel.send("Recently added role creation is `" + guildSettings.recentlyAddedBoolean + "`\nTo change it type: `" + guildSettings.prefix + "bot recentlyAddedBoolean off`");
				else return message.channel.send("Recently added role creation is `" + guildSettings.recentlyAddedBoolean + "`\nTo change it type: `" + guildSettings.prefix + "bot recentlyAddedBoolean on/off` (where *on/off* is an option of either **on** or **off**)");
      }
		}
    else if (command === "help") {
      // help message goes here
    }
	},
};
