module.exports = {
	name: 'showlist',
  aliases: ['showslist'],
	description: 'Displays a list of shows currently airing on the Plex server',
	usage: '',
	adminCommand: false,
	async execute(message, args, prefix, guildSettings, client, Discord, config, fetch, exemptEmbedReactRoles, tautulli, sonarr) {
		var json = await sonarr.sonarrService.getSeries();
		var showsList = "\n";
		for (var i = 0; i < json.length; i++) {
			if (json[i].status === "continuing") {
				showsList = showsList + "> " + json[i].title + "\n";
			}
		}

		embed = new Discord.RichEmbed()
			.setAuthor(client.user.username, client.user.avatarURL)
			.setDescription("Below is a list of shows on the Plex Server that are still continuing:\n" + showsList)
			.setFooter("Fetched")
			.setTimestamp(new Date())
			.setColor(0x00AE86);
		message.channel.send({embed});
  },
};
