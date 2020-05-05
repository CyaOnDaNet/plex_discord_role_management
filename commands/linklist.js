module.exports = {
	name: 'linklist',
	description: 'Displays a list of linked users in the database',
	usage: '',
	adminCommand: true,
	async execute(message, args, prefix, guildSettings, client, Discord, config, fetch, exemptEmbedReactRoles, tautulli, sonarr) {
    if (!message.channel.guild.member(message.author).hasPermission('ADMINISTRATOR')) {
      return message.channel.send('You do not have permissions to use `' + prefix + command + '`! It contains sensitive information.');
    }

		var fieldCount = 0;
		var linkListPage = 1;

    embed = new Discord.MessageEmbed()
      .setAuthor(client.user.username, client.user.avatarURL)
      .setDescription("**Below is a list of linked Discord-Plex accounts:**\n\n")
      .setFooter("Fetched")
      .setTimestamp(new Date())
      .setColor(0x00AE86);

    for (const linkQuery of client.searchGuildUserList.iterate()) {
      if (linkQuery.guild === message.guild.id && linkQuery.plexUserName != null) {
				if (fieldCount >= 25) { //Checks For Discord Embed Field Limit
					await message.channel.send({embed});

					fieldCount = 0;
				  linkListPage++;

					embed = new Discord.MessageEmbed()
						.setAuthor(client.user.username, client.user.avatarURL)
						.setDescription(`**Link List __Page ${linkListPage}__**\n\n`)
						.setFooter("Fetched")
						.setTimestamp(new Date())
						.setColor(0x00AE86);
				}
        embed.addField(linkQuery.plexUserName,'is linked to: <@' + linkQuery.discordUserID + '>',  true);
				fieldCount++;
      }
    }
    message.channel.send({embed});
  },
};
