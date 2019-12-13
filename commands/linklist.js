module.exports = {
	name: 'linklist',
	description: 'Displays a list of linked users in the database',
	async execute(message, args, prefix, guildSettings, client, Discord, tautulli) {
    if (!message.channel.guild.member(message.author).hasPermission('ADMINISTRATOR')) {
      return message.channel.send('You do not have permissions to use `' + prefix + command + '`! It contains sensitive information.');
    }
    embed = new Discord.RichEmbed()
      .setAuthor(client.user.username, client.user.avatarURL)
      .setDescription("Below is a list of linked Discord-Plex accounts:\n\n")
      .setFooter("Fetched")
      .setTimestamp(new Date())
      .setColor(0x00AE86);

    for (const linkQuery of client.searchGuildUserList.iterate()) {
      if (linkQuery.guild === message.guild.id && linkQuery.plexUserName != null) {
        embed.addField(linkQuery.plexUserName,'is linked to: <@' + linkQuery.discordUserID + '>',  true);
      }
    }
    message.channel.send({embed});
  },
};
