module.exports = {
	name: 'channel',
  aliases: [],
	description: '[OBSOLETE] This command has moved to notify',
	usage: '',
	adminCommand: true,
	subcommands: {

	},
	async execute(message, args, prefix, guildSettings, client, Discord, config, fetch, exemptEmbedReactRoles, tautulli, sonarr, notificationSettings, args2, ogCommand, command) {
		return message.channel.send(`This command has moved to \`${prefix}notify.\``);
  },
};
