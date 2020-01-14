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
  },
};
