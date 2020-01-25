module.exports = {
	name: 'showlist',
  aliases: ['showslist'],
	description: 'Displays a list of shows currently airing on the Plex server',
	usage: '',
	adminCommand: false,
	async execute(message, args, prefix, guildSettings, client, Discord, config, fetch, exemptEmbedReactRoles, tautulli, sonarr) {
		var json = await sonarr.sonarrService.getSeries();
		if (json == "error") {
			console.log("Couldn't connect to Sonarr, check your settings.");
			return message.channel.send("Couldn't connect to Sonarr, check your settings.");
		}

		var showsList = "\n";
		var showListPage = 1;

		for (var i = 0; i < json.length; i++) {
			if (json[i].status === "continuing") {
				var tempStringCountCheck = "**Below is a list of shows on the Plex Server that are still continuing:**\n" + showsList + "> " + json[i].title + "\n";

				if (tempStringCountCheck.length >= 2048) {  //Checks For Discord Embed Description Limit
					if (showListPage === 1) {
						embed = new Discord.RichEmbed()
							.setAuthor(client.user.username, client.user.avatarURL)
							.setDescription("**Below is a list of shows on the Plex Server that are still continuing:**\n" + showsList)
							.setFooter("Fetched")
							.setTimestamp(new Date())
							.setColor(0x00AE86);

						await message.channel.send({embed});
						showListPage++;
						showsList = "\n";
					}
					else {
						embed = new Discord.RichEmbed()
							.setAuthor(client.user.username, client.user.avatarURL)
							.setDescription(`**Show List __Page ${showListPage}__**:\n` + showsList)
							.setFooter("Fetched")
							.setTimestamp(new Date())
							.setColor(0x00AE86);

						await message.channel.send({embed});
						showListPage++;
						showsList = "\n";
					}
				}

				showsList = showsList + "> " + json[i].title + "\n";
			}
		}

		if (showListPage === 1) {
			embed = new Discord.RichEmbed()
				.setAuthor(client.user.username, client.user.avatarURL)
				.setDescription("**Below is a list of shows on the Plex Server that are still continuing:**\n" + showsList)
				.setFooter("Fetched")
				.setTimestamp(new Date())
				.setColor(0x00AE86);
		}
		else {
			embed = new Discord.RichEmbed()
				.setAuthor(client.user.username, client.user.avatarURL)
				.setDescription(`**Show List __Page ${showListPage}__**:\n` + showsList)
				.setFooter("Fetched")
				.setTimestamp(new Date())
				.setColor(0x00AE86);
		}
		message.channel.send({embed});
  },
};
