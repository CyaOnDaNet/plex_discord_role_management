module.exports = {
	name: 'users',
	description: 'Displays a list of users with access to the Plex Server',
	usage: '',
	adminCommand: true,
	async execute(message, args, prefix, guildSettings, client, Discord, tautulli) {
    if (!message.channel.guild.member(message.author).hasPermission('ADMINISTRATOR')) {
      return message.channel.send('You do not have permissions to use `' + prefix + command + '`! It contains sensitive information.');
    }

    tautulli.get('get_users').then((result) => {
      var users = result.response.data;
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
    }).catch((error) => {
      console.log("Couldn't connect to Tautulli, check your settings.");
      console.log(error);
      // do we need to remove roles if this is the case? Maybe we don't...
    });
  },
};
