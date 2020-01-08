module.exports = {
	name: 'test',
	description: 'Testing Stuff',
	usage: '',
	adminCommand: true,
	async execute(message, args, prefix, guildSettings, client, Discord, tautulli, config, fetch, exemptEmbedReactRoles) {

		var emojiOptions = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
		const filter = (reaction, user) => emojiOptions.indexOf(reaction.emoji.name) != -1;

		let sentMessage = await message.channel.send("Test");
		sentMessage.react(emojiOptions[0])
		  .then(() => {
				sentMessage.awaitReactions(filter, { time: 15000 })
			    .then(collected => {
						var selectedEmojis = [];
						//console.log(`Collected ${collected.size} reactions`)
						collected.tap(selectedOptions => {
							if (selectedOptions.users.get(message.author.id) != undefined) {
								console.log(selectedOptions._emoji.name);
								selectedEmojis.push(selectedOptions._emoji.name);
							}
						});
						var returnMessage = "You selected: ";
						for(let emojis of selectedEmojis) {
    						returnMessage += emojis + " ";
						}
						//console.log(selectedEmojis);
						message.channel.send(returnMessage)
					})
			    .catch(console.error);
		  })
			.then(() => sentMessage.react(emojiOptions[1]))
			.then(() => sentMessage.react(emojiOptions[2]))
			.then(() => sentMessage.react(emojiOptions[3]))
			.then(() => sentMessage.react(emojiOptions[4]))
			.then(() => sentMessage.react(emojiOptions[5]))
			.then(() => sentMessage.react(emojiOptions[6]))
			.then(() => sentMessage.react(emojiOptions[7]))
			.then(() => sentMessage.react(emojiOptions[8]))
			.then(() => sentMessage.react(emojiOptions[9]))
			.catch(() => console.error('One of the emojis failed to react.'));


		/*
		embed = new Discord.RichEmbed()
			.setTitle('Show Title')
			.setURL('https://www.google.com/')
			.setDescription(`Description Goes Here`)
			.setThumbnail()
			.addField('View Details', '[Plex Web](https://www.google.com/)')
			.setTimestamp(new Date())
			.setColor(0x00AE86);
		message.channel.send("Content and embed?", {embed});




*/

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
