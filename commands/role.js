module.exports = {
	name: 'role',
  aliases: ['watchingrole'],
	description: 'Sets the watching role for the server',
	async execute(message, args, prefix, guildSettings, client, Discord, tautulli) {
    if (message.channel.guild.member(message.author).hasPermission('ADMINISTRATOR')) {
      // link a discord user and plex user
      let mentionedRole = message.mentions.roles.first();
      if(!mentionedRole) {
        return message.channel.send("You did not specify a valid role for watching assignment!");
      } else {
        guildSettings.watchingRole = mentionedRole.id;
        client.setGuildSettings.run(guildSettings);
        guildSettings = client.getGuildSettings.get(message.guild.id);
        message.channel.send("The watching role was succesfully set to <@&" + guildSettings.watchingRole + ">");
      }
    } else {
      return message.channel.send('You do not have permissions to use `' + prefix + command + '`!');
    }
  },
};
