module.exports = {
	name: 'test',
	description: 'Testing Stuff',
	usage: '',
	adminCommand: true,
	async execute(message, args, prefix, guildSettings, client, Discord, tautulli, config, fetch, exemptEmbedReactRoles, tautulliHook, sonarr) {

		message.channel.send("To Do:\n • implement Admin role usage\n • write proper readme\n • finish notifications command:\n     • notifications refresh\n     • notifications reset\n");




    /*
		var args2 = message.content.slice(prefix.length).trim().split(/ +/g);
		var ogCommand = args2.shift().toLowerCase();

		if (args.length > 0) {
			command = args.shift().toLowerCase();
		} else {
			command = "help";
		}






		if (command === "ungroup") {

		}
		*/
	},
};
