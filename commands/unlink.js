module.exports = {
	name: 'unlink',
	description: 'Unlink Plex Users and Discord Users',
	usage: '@DiscordUser PlexUsername',
	adminCommand: true,
	async execute(message, args, prefix, guildSettings, client, Discord, config, fetch, exemptEmbedReactRoles, tautulli, sonarr) {
    if (message.channel.guild.member(message.author).hasPermission('ADMINISTRATOR')) {
      // link a discord user and plex user
      let mentionedUser = message.mentions.users.first();
      if(!mentionedUser) {
        return message.channel.send("You did not specify a valid user to link!");
      }
			let userList = "";
			for (const tempUser of client.getLinkByDiscordUserID.all(mentionedUser.id)) {
			  if (tempUser.guild == message.guild.id) {
			    userList = tempUser;
			    break;
			  }
			}

      if (!userList) {
        return message.channel.send('Discord User was never linked to begin with, nobody to unlink!');
      }
      else {
        userList.plexUserName = null;
        client.setUserList.run(userList);
      }

      message.channel.send('Succesfully unlinked **' + mentionedUser.username + '** from a Plex account.');

    } else {
      return message.channel.send('You do not have permissions to use `' + prefix + 'unlink`!');
    }
  },
};
