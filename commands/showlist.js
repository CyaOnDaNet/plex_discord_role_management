module.exports = {
	name: 'showlist',
  aliases: ['showslist'],
	description: 'Displays a list of shows currently airing on the Plex server',
	usage: '',
	adminCommand: false,
	async execute(message, args, prefix, guildSettings, client, Discord, config, fetch, exemptEmbedReactRoles, tautulli, sonarr) {
		var json;
		for (let sonarrInstance in sonarr) {
	    var tempJSON = await sonarr[sonarrInstance].getSeries();
	    if (tempJSON == "error") {
	  		console.log("Couldn't connect to Sonarr, check your settings.");
				return message.channel.send("Couldn't connect to Sonarr, check your settings.");
	  	}
	    else {
	      if (json === "" || json === null || json === undefined) json = tempJSON;
	      else json = json.concat(tempJSON);  // join all sonarr instace results together
	    }
	  }
		// Let's remove any duplicate shows that are on multiple sonarr instances
		var tempJSON = [];
		for (var i = 0; i < json.length; i++) {
  		var found = false;
  		for (var j = 0; j < tempJSON.length; j++) {
    		if (tempJSON[j].title == json[i].title && tempJSON[j].tvdbId == json[i].tvdbId && tempJSON[j].imdbId == json[i].imdbId) {
      		found = true;
      		break;
    		}
  		}
  		if (!found) {
    		tempJSON.push(json[i]);
  		}
		}
		json = tempJSON;

		var showsList = "\n";
		var showListPage = 1;

		sortedShowList = [];
		for (var i = 0; i < json.length; i++) {
			if (json[i].status === "continuing") {
        sortedShowList.push(json[i].title);
			}
		}
		sortedShowList = await sortedShowList.sort();

		for (var i = 0; i < sortedShowList.length; i++) {
			var tempStringCountCheck = "**Below is a list of shows on the Plex Server that are still continuing:**\n" + showsList + "> " + sortedShowList[i] + "\n";

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

			showsList = showsList + "> " + sortedShowList[i] + "\n";
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
