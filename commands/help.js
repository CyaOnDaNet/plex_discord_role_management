module.exports = {
	name: 'help',
	description: 'List all of my commands or info about a specific command.',
	aliases: ['commands'],
	usage: '[command name]',
	adminCommand: false,
	async execute(message, args, prefix, guildSettings, client, Discord, tautulli, config, fetch, exemptEmbedReactRoles, tautulliHook) {
    const data = [];
		const adminData = [];
    const { commands } = message.client;

    if (!args.length) {
      commands.map(command => {
				if (command.adminCommand === true) {
					if (message.channel.guild.member(message.author).hasPermission('ADMINISTRATOR')) {
						if (command.usage) {
							adminData.push(`> \`${prefix}${command.name}\` ${command.usage}`);
						}  else {
							adminData.push(`> \`${prefix}${command.name}\``);
						}
					}
				}
				else if (command.usage) {
					data.push(`> \`${prefix}${command.name}\` ${command.usage}`);
				}  else {
					data.push(`> \`${prefix}${command.name}\``);
				}
			});

			var description = "";
			for (var i = 0; i < data.length; i++){
				if (data[i] === undefined || data[i] === null) break;
	      description = description + data[i] + "\n";
			}

			if (message.channel.guild.member(message.author).hasPermission('ADMINISTRATOR')) {
        description = description + "Admin commands:\n";
				for (var i = 0; i < adminData.length; i++){
					if (adminData[i] === undefined || adminData[i] === null) break;
		      description = description + adminData[i] + "\n";
				}
			}

			embed = new Discord.RichEmbed()
				.setAuthor('Here\'s a list of all my commands:')
				.setDescription(`${description}`)
				.addField('\u200b', `You can send \`${prefix}help [command name]\` to get info on a specific command!`)
				.setFooter("Helped")
				.setTimestamp(new Date())
				.setColor(0x00AE86);

      return message.channel.send({embed});
    }

    const name = args[0].toLowerCase();
    const command = commands.get(name) || commands.find(c => c.aliases && c.aliases.includes(name));

    if (!command) {
	    return message.reply('that\'s not a valid command!');
    }

    data.push(`**Name:** ${command.name}`);

    if (command.aliases) data.push(`**Aliases:** ${command.aliases.join(', ')}`);
    if (command.description) data.push(`**Description:** ${command.description}`);
    if (command.usage) data.push(`**Usage:** ${prefix}${command.name} ${command.usage}`);
		if (command.subcommands) {
			data.push(`**Subcommands:**`);
			for (var subcommand in command.subcommands){
				data.push(`> ${prefix}${command.name} ${subcommand} ${command.subcommands[subcommand]}`);
      }
		}

    data.push(`**Cooldown:** ${command.cooldown || 3} second(s)`);

		var description = "";
		for (var i = 0; i < data.length; i++){
			if (data[i] === undefined || data[i] === null) break;
      description = description + data[i] + "\n";
		}
		embed = new Discord.RichEmbed()
			.setAuthor(`Here is more info about the ${command.name} command`)
			.setDescription(`${description}`)
			.setFooter("Helped")
			.setTimestamp(new Date())
			.setColor(0x00AE86);

    //message.channel.send(data, { split: true });
		message.channel.send({embed});
	},
};
