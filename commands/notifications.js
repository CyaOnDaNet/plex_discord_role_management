module.exports = {
	name: 'notifications',
  aliases: ['n'],
	description: 'Notification Settings that can be configured',
	usage: '[subcommand]',
	adminCommand: true,
	subcommands: {
		'edit':'',
		'custom add':'@mentionedRole Optional Description',
		'custom remove':'',
		'library':'',
		'exclude':'show',
		'include':'show',
		'group':'New Group Name for Shows [show1] [show2] [etc.]',
		'ungroup':'[show1] [show2] [etc.]',
		'list':'',
		'preview':'',
		'channel':'',
	},
	async execute(message, args, prefix, guildSettings, client, Discord, config, fetch, exemptEmbedReactRoles, tautulli, sonarr) {
    // This is where we change notification information

		const fs = require('fs');
		client.notifications_subcommands = new Discord.Collection();
		const notifications_subcommands_files = fs.readdirSync('./commands/subcommands/notifications').filter(file => file.endsWith('.js'));
		for (const file of notifications_subcommands_files) {
			const subcommand = require(`./subcommands/notifications/${file}`);
			client.notifications_subcommands.set(subcommand.name, subcommand);
		}

    let notificationSettings;
		var args2 = message.content.slice(prefix.length).trim().split(/ +/g);
    var ogCommand = args2.shift().toLowerCase();

    if (args.length > 0) {
      command = args.shift().toLowerCase();
    } else {
      return;
    }

		const subcommand = client.notifications_subcommands.get(command) || client.notifications_subcommands.find(cmd => cmd.aliases && cmd.aliases.includes(command));
		if (!subcommand) return;

		try {
			subcommand.execute(message, args, prefix, guildSettings, client, Discord, config, fetch, exemptEmbedReactRoles, tautulli, sonarr, notificationSettings, args2, ogCommand, command);
		} catch (error) {
			console.error(error);
			message.reply(`There was an error trying to execute that command! Check the logs for details.`);
		}

    // Below is left over commands I never made. If I decided to make them they need their own files in the subcommands folder.
		/*
		if (command === "refresh") {
      // grabs list of currently airing shows and adds them to notifications channel
    }
    else if (command === "reset") {
      // Alphabetically re-sort items in notfication settings embed
    }
		*/
  },
};
