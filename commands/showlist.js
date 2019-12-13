module.exports = {
	name: 'showlist',
  aliases: ['showslist'],
	description: 'Displays a list of shows currently airing on the Plex server',
	usage: '',
	adminCommand: false,
	async execute(message, args, prefix, guildSettings, client, Discord, tautulli) {
    var url = config.sonarr_web_address;
    if (!url) {
      console.log("No sonarr settings detected in `./config/config.json`!");
      return message.channel.send("No sonarr settings detected in `./config/config.json`!");
    }
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      // we need an http or https specified so we will asumme http
      console.log("Please adjust your config.sonarr_web_address to include http:// or https://. Since it was not included, I am assuming it is http://");
      url = "http://" + url;
    }
    if (!url.endsWith('/')) {
      url = url + '/';
    }
    url = url + "api/series?apikey=" + config.sonarr_api_key;

    fetch(url,  {
        method: 'GET'
    })
    .then(res => res.json())
    .then(json => {
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
    })
    .catch((error) => {
      console.log("Couldn't connect to Sonarr, check your settings.");
      message.channel.send("Couldn't connect to Sonarr, check your settings.");
      console.log(error);
      // do we need to remove roles if this is the case? Maybe we don't...
    });
  },
};
