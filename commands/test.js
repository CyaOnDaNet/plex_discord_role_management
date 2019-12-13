module.exports = {
	name: 'test',
	description: 'Testing Stuff',
	usage: '',
	adminCommand: true,
	async execute(message, args, prefix, guildSettings, client, Discord, tautulli, config, fetch) {
		embed = new Discord.RichEmbed()
			.setTitle('Show Title')
			.setURL('https://www.google.com/')
			.setDescription(`Description Goes Here`)
			.setThumbnail()
			.addField('View Details', '[Plex Web](https://www.google.com/)')
			.setTimestamp(new Date())
			.setColor(0x00AE86);
		message.channel.send("Content and embed?", {embed});
		/*
    var tenNumbers = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
		let notificationSettings;
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
	  .then(async json => {
	    let showsList = [];
	    var count = 0;
			console.log(json[0]);
		})
		.catch();
		*/
  },
};
