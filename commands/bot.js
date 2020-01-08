module.exports = {
	name: 'bot',
	description: 'Bot Settings that can be configured',
	usage: '[subcommand]',
	adminCommand: true,
	subcommands: {
		'info':'',
		'prefix':'newprefix',
		'logchannel':'@channel',
	},
	async execute(message, args, prefix, guildSettings, client, Discord, tautulli, config, fetch, exemptEmbedReactRoles) {
    // This is where we change bot information
    if (args.length > 0) {
      command = args.shift().toLowerCase();
    } else {
      command = "help";
    }

    if (command === "info" || command === "information") {
      embed = new Discord.RichEmbed()
        .setAuthor(client.user.username, client.user.avatarURL)
        .setDescription("Below is a list of important bot info:\n")
        .addField("Prefix: ", '`' + prefix + '`',  true)
        .addField("Watching Role: ", '<@&' + guildSettings.watchingRole + '>')
        .setFooter("Fetched")
        .setTimestamp(new Date())
        .setColor(0x00AE86);

      if (guildSettings.logChannelBoolean === "off") {
        embed.addField("Logging Status: ", '**Disabled**');
      }
      else if (guildSettings.logChannelBoolean === "on") {
        embed.addField("Logging Status: ", '**Enabled**');
				embed.addField("Log Channel: ", '<#' + guildSettings.logChannel + '>')
      }

			if (guildSettings.notificationChannelBoolean === "off") {
        embed.addField("Content Notifying Status: ", '**Disabled**');
      }
      else if (guildSettings.notificationChannelBoolean === "on") {
        embed.addField("Content Notifying Status: ", '**Enabled**');
				embed.addField("Content Notifications Channel: ", '<#' + guildSettings.notificationChannel + '>')
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
	},
};
