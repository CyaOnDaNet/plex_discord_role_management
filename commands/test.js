module.exports = {
	name: 'test',
	description: 'Testing Stuff',
	usage: '',
	adminCommand: true,
	async execute(message, args, prefix, guildSettings, client, Discord, tautulli, config, fetch, exemptEmbedReactRoles, tautulliHook, sonarr) {

		message.channel.send("To Do:\n • implement Admin role usage\n • write proper readme\n • finish notifications command:\n     • notifications refresh\n     • notifications reset\n     • notifications group\n     • notifications ungroup");

	},
};
