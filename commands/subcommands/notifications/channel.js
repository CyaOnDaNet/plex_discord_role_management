module.exports = {
	name: 'channel',
  aliases: [],
	description: 'Sets the notification channel or turns it off',
	usage: '',
	adminCommand: true,
	subcommands: {

	},
	async execute(message, args, prefix, guildSettings, client, Discord, config, fetch, exemptEmbedReactRoles, tautulli, sonarr, notificationSettings, args2, ogCommand, command) {
    // Sets the notification channel or turns it off
    if (args.length > 0) {
      let mentionedChannel = message.mentions.channels.first();
      if(!mentionedChannel) {
        command = args.shift().toLowerCase();
        if (command === "off") {
          // disable notification channel
          guildSettings.notificationChannelBoolean = "off";
          client.setGuildSettings.run(guildSettings);
          guildSettings = client.getGuildSettings.get(message.guild.id);
          message.channel.send("Notifications disabled!");
        } else {
          return message.channel.send("You did not specify a valid channel to set the notification channel to!");
        }
      }
      else if (message.channel.guild.member(message.author).hasPermission('ADMINISTRATOR')) {
        guildSettings.notificationChannel = mentionedChannel.id;
        guildSettings.notificationChannelBoolean = "on";
        client.setGuildSettings.run(guildSettings);
        guildSettings = client.getGuildSettings.get(message.guild.id);
        message.channel.send("Notification channel changed to <#" + guildSettings.notificationChannel + ">!");
      } else {
        return message.channel.send('You do not have permissions to use `' + prefix + ogCommand + ' channel` in <#' + message.channel.id + '>!');
      }
    } else {
      return message.channel.send("The current notification channel is <#" + guildSettings.notificationChannel + ">!\nTo change it type: `" + guildSettings.prefix + ogCommand + " channel #logs` (where **#logs** is the desired channel)\nTo disable it type: `" + guildSettings.prefix + ogCommand + " channel off`");
    }
  },
};
