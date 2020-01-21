module.exports = {
	name: 'link',
	description: 'Link Plex Users to Discord Users',
	usage: '@DiscordUser PlexUsername',
	adminCommand: true,
	async execute(message, args, prefix, guildSettings, client, Discord, config, fetch, exemptEmbedReactRoles, tautulli, sonarr) {
    if (message.channel.guild.member(message.author).hasPermission('ADMINISTRATOR')) {
      // link a discord user and plex user
      let mentionedUser = message.mentions.users.first();
      if(!mentionedUser) {
        return message.channel.send("You did not specify a valid Discord User to link!");
      }
      var plexUserName = message.content.slice(message.content.indexOf(mentionedUser.id) + mentionedUser.id.length + 1).trim();
			let userList = "";
			for (const tempUser of client.getLinkByDiscordUserID.all(mentionedUser.id)) {
			  if (tempUser.guild == message.guild.id) {
			    userList = tempUser;
			    break;
			  }
			}

			if (plexUserName === null || plexUserName === undefined || plexUserName === "") {
				return message.channel.send(`You did not specify a valid Plex User to link!\nPlease use the format: \`${prefix}link @DiscordUser PlexUsername\``);
			}

			var users = await tautulli.tautulliService.getUsers();
			if (users == "error") {
				console.log("Couldn't connect to Tautulli, check your settings.");
				return message.channel.send("Couldn't connect to Tautulli, check your settings.");
			}
			users = users.data;

			var userExists = false;
			for (var i = 0; i < users.length; i++) {
				if (plexUserName.toLowerCase() === users[i].username.toLowerCase()) {
					userExists = true;
					plexUserName = users[i].username; //This allows for any upper or lower case discrepancies to be ignored while still storing the actual PlexUsername
				}
			}

			if (!userExists) {
				return message.channel.send(`Couldn't find the Plex User: \`${plexUserName}\`, please try again!\nFor a list of Plex usernames, type: \`${prefix}users\``);
			}

      if (!userList) {
        userList = { id: `${message.guild.id}-${client.user.id}-${mentionedUser.id}`, guild: message.guild.id, discordUserID: mentionedUser.id, plexUserName: plexUserName, watching: "false" };
        client.setUserList.run(userList);
      }
      else {
        userList.plexUserName = plexUserName;
        client.setUserList.run(userList);
      }

      message.channel.send('Succesfully linked **' + mentionedUser.username + '** as Plex user: `' + plexUserName + '`');

    } else {
      return message.channel.send('You do not have permissions to use `' + prefix + 'link`!');
    }
  },
};
