module.exports = {
	name: 'unlink',
	description: 'Unlink Plex Users and Discord Users',
	async execute(message, args, prefix, guildSettings, client, Discord, tautulli) {
    if (message.channel.guild.member(message.author).hasPermission('ADMINISTRATOR')) {
      // link a discord user and plex user
      let mentionedUser = message.mentions.users.first();
      if(!mentionedUser) {
        return message.channel.send("You did not specify a valid user to link!");
      }
      let userList = client.getLinkByDiscordUserID.get(mentionedUser.id);

      if (!userList) {
        userList = { id: `${message.guild.id}-${client.user.id}-${mentionedUser.id}`, guild: message.guild.id, discordUserID: mentionedUser.id, plexUserName: null, watching: "false" };
        client.setUserList.run(userList);
        userList = client.getLinkByDiscordUserID.get(mentionedUser.id);
      }
      else {
        userList.plexUserName = null;
        client.setUserList.run(userList);
        userList = client.getLinkByDiscordUserID.get(mentionedUser.id);
      }

      message.channel.send('Succesfully unlinked **' + mentionedUser.username + '** from a Plex account.');

    } else {
      return message.channel.send('You do not have permissions to use `' + prefix + 'unlink`!');
    }
  },
};
