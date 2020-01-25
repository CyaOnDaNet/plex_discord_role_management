module.exports = {
	name: 'users',
	description: 'Displays a list of users with access to the Plex Server',
	usage: '',
	adminCommand: true,
	async execute(message, args, prefix, guildSettings, client, Discord, config, fetch, exemptEmbedReactRoles, tautulli, sonarr) {
    if (!message.channel.guild.member(message.author).hasPermission('ADMINISTRATOR')) {
      return message.channel.send('You do not have permissions to use `' + prefix + command + '`! It contains sensitive information.');
    }

		var users = await tautulli.tautulliService.getUsers();
		if (users == "error") {
			console.log("Couldn't connect to Tautulli, check your settings.");
			return message.channel.send("Couldn't connect to Tautulli, check your settings.");
		}
		users = users.data;

		var userList = "\n";
		var userListPage = 1;

		for (var i = 0; i < users.length; i++) {
			var tempStringCountCheck = "**Below is a list of users with access to the Plex Server:**\n" + userList + "> " + users[i].username + "\n";

			if (tempStringCountCheck.length >= 2048) {  //Checks For Discord Embed Description Limit
				if (userListPage === 1) {
					embed = new Discord.RichEmbed()
						.setAuthor(client.user.username, client.user.avatarURL)
						.setDescription("**Below is a list of users with access to the Plex Server:**\n" + userList)
						.setFooter("Fetched")
						.setTimestamp(new Date())
						.setColor(0x00AE86);

					await message.channel.send({embed});
					userListPage++;
					userList = "\n";
				}
				else {
					embed = new Discord.RichEmbed()
						.setAuthor(client.user.username, client.user.avatarURL)
						.setDescription(`**User List __Page ${userListPage}__**:\n` + userList)
						.setFooter("Fetched")
						.setTimestamp(new Date())
						.setColor(0x00AE86);

					await message.channel.send({embed});
					userListPage++;
					userList = "\n";
				}
			}
			userList = userList + "> " + users[i].username + "\n";
		}

		if (userListPage === 1) {
			embed = new Discord.RichEmbed()
				.setAuthor(client.user.username, client.user.avatarURL)
				.setDescription("**Below is a list of users with access to the Plex Server:**\n" + userList)
				.setFooter("Fetched")
				.setTimestamp(new Date())
				.setColor(0x00AE86);
		}
		else {
			embed = new Discord.RichEmbed()
				.setAuthor(client.user.username, client.user.avatarURL)
				.setDescription(`**User List __Page ${userListPage}__**:\n` + userList)
				.setFooter("Fetched")
				.setTimestamp(new Date())
				.setColor(0x00AE86);
		}
		message.channel.send({embed});
  },
};
