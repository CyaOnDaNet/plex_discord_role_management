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
		if (users && users.error) {
			if (users.error == true) {
				if (users.moreInfo && users.moreInfo != "") {
					if (users.moreInfo == "Unestablished Connection with Tautulli") {
						console.log("Command `users` failed because connection with Tautulli hasn't been established yet.");
						return message.channel.send("A connection with Tautulli hasn't been established yet, wait 30 seconds and try again or check the logs for more details.");
					}
					else {
						console.log("Command `users` failed because I couldn't connect to Tautulli, check your settings.");
						return message.channel.send(`Couldn't connect to Tautulli, the reason given was:\n\`${users.moreInfo}\``);
					}
				}
				else {
					console.log("Command `users` failed because I couldn't connect to Tautulli, check your settings.");
					return message.channel.send("Couldn't connect to Tautulli, check your settings.");
				}
			}
		}
		users = users.data;

		var userList = "\n";
		var userListPage = 1;
		var userTotalCount = 0;
		for (var i = 0; i < users.length; i++) {
			if (users[i].username == "Local") {
				//Ignore the Local DLNA account if it's enabled so we have an accurate number
			}
			else {
				await userTotalCount++;
			}
		}

		for (var i = 0; i < users.length; i++) {
			var tempStringCountCheck = `**Below is a list of the __${userTotalCount}__ users with access to the Plex Server:**\n${userList}> ${users[i].username}\n`;

			if (tempStringCountCheck.length >= 2048) {  //Checks For Discord Embed Description Limit
				if (userListPage === 1) {
					embed = new Discord.MessageEmbed()
						.setAuthor(client.user.username, client.user.avatarURL)
						.setDescription(`**Below is a list of the __${userTotalCount}__ users with access to the Plex Server:**\n${userList}`)
						.setFooter("Fetched")
						.setTimestamp(new Date())
						.setColor(0x00AE86);

					await message.channel.send({embed});
					userListPage++;
					userList = "\n";
				}
				else {
					embed = new Discord.MessageEmbed()
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
			embed = new Discord.MessageEmbed()
				.setAuthor(client.user.username, client.user.avatarURL)
				.setDescription(`**Below is a list of the __${userTotalCount}__ users with access to the Plex Server:**\n${userList}`)
				.setFooter("Fetched")
				.setTimestamp(new Date())
				.setColor(0x00AE86);
		}
		else {
			embed = new Discord.MessageEmbed()
				.setAuthor(client.user.username, client.user.avatarURL)
				.setDescription(`**User List __Page ${userListPage}__**:\n` + userList)
				.setFooter("Fetched")
				.setTimestamp(new Date())
				.setColor(0x00AE86);
		}
		message.channel.send({embed});
  },
};
