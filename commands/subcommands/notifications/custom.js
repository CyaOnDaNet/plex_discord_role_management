module.exports = {
	name: 'custom',
  aliases: [],
	description: 'Custom Notification React Roles',
	usage: '',
	adminCommand: true,
	subcommands: {
		'add':'@mentionedRole Optional Description',
		'remove':'',
	},
	async execute(message, args, prefix, guildSettings, client, Discord, config, fetch, exemptEmbedReactRoles, tautulli, sonarr, notificationSettings, args2, ogCommand, command) {
    // custom notification settings, user is in charge of managing roles
    if (args.length > 0) {
      if (message.channel.guild.member(message.author).hasPermission('ADMINISTRATOR')) {
        command = args.shift().toLowerCase();
        if (command === "add") {
          let mentionedRole = message.mentions.roles.first();
          if(!mentionedRole) {
            return message.channel.send("You did not specify a valid role for that command, please try again.");
          } else {
            // add custom role
            if (guildSettings.customRoleCount + 1 > 6) {
              return message.channel.send("You have hit the custom react role limit of 6, please remove a custom react role to add a new one");
            }
            else {
              var description = '';
              let notificationSettings;

              description = message.content.slice(message.content.indexOf(">") + 1, message.content.length).trim();

              notificationSettings = { id: `${message.guild.id}-${client.user.id}-${mentionedRole.id}`, guild: message.guild.id, name: `Custom-${mentionedRole.id}`, category: `custom`, description: description, roleID: mentionedRole.id };
              client.setNotificationSettings.run(notificationSettings);

              guildSettings.customRoleCount = guildSettings.customRoleCount + 1;
              client.setGuildSettings.run(guildSettings);
              guildSettings = client.getGuildSettings.get(message.guild.id);

              return message.channel.send("Custom react role successfully added!");
            }
          }
        }
        else if (command === "delete" || command === "remove") {
          // generate embed list to react role and delete
          var customList = {};
          var customList2 = {};

          var emojiOptions = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
          const filter = (reaction, user) => emojiOptions.indexOf(reaction.emoji.name) != -1;

          var setDescription = "The following custom react roles can be removed:\n\n";
          exemptEmbedReactRoles.push(`Custom React Role Removal:`);
          embed = new Discord.MessageEmbed()
            .setAuthor('Custom React Role Removal:') //don't foget to edit exemptEmbedReactRoles above if name changes so it is ignored in index.js role react
            .setTimestamp(new Date())
            .setColor(0x00AE86);

          var count = 0;
          for (const notificationSettings of client.searchNotificationSettings.iterate()) {
            if (notificationSettings.category === "custom") {
              if (notificationSettings.id === `${message.guild.id}-${client.user.id}-${notificationSettings.roleID}`) {
                //Check to make sure client id is the same, in case using a different bot token
                customList[emojiOptions[count]] = `${notificationSettings.roleID}`;
                setDescription = setDescription + "\n" + `${emojiOptions[count]} <@&${notificationSettings.roleID}> ${notificationSettings.description}`;
                customList2[emojiOptions[count]] = `<@&${notificationSettings.roleID}> ${notificationSettings.description}`;
                count++;
              }
            }
          }

          if (count < 1) {
            return message.channel.send("There is nothing to remove.");
          }
          else {
            embed.setDescription(setDescription);
          }

          let sentMessage = await message.channel.send({embed});
          sentMessage.react(emojiOptions[0])
            .then(async () => {
              sentMessage.awaitReactions(filter, { time: 15000 })
                .then(collected => {
                  var selectedEmojis = [];
                  collected.each(selectedOptions => {
                    if (selectedOptions.users.cache.get(message.author.id) != undefined) {
                      selectedEmojis.push(selectedOptions._emoji.name);
                    }
                  });
                  var setDescription = "Successfully removed the following Custom React Roles:\n(*Don't forget to delete the role in Discord, I don't manage custom roles!*)\n\n";
                  embed = new Discord.MessageEmbed()
                    .setTimestamp(new Date())
                    .setColor(0x00AE86);

                  var count2 = 0;
                  for(let emojis of selectedEmojis) {
                    client.deleteNotificationSettings.run(`${message.guild.id}-${client.user.id}-${customList[emojis]}`);    // delete a row based on id
                    guildSettings.customRoleCount = guildSettings.customRoleCount - 1;
                    client.setGuildSettings.run(guildSettings);
                    guildSettings = client.getGuildSettings.get(message.guild.id);

                    setDescription = setDescription + "\n" + `${customList2[emojis]}`;
                    count2++;
                  }

                  if (count2 === 0) {
                    embed = new Discord.MessageEmbed()
                      .setDescription("Nothing selected in time, no custom React Roles were removed.")
                      .setTimestamp(new Date())
                      .setColor(0x00AE86);
                  }
                  else {
                    embed.setDescription(setDescription);
                  }

                  sentMessage.edit({embed});
                })
                .catch(console.error);
            })
            .then(async () => { if (count > 1) await sentMessage.react(emojiOptions[1]) })
            .then(async () => { if (count > 2) await sentMessage.react(emojiOptions[2]) })
            .then(async () => { if (count > 3) await sentMessage.react(emojiOptions[3]) })
            .then(async () => { if (count > 4) await sentMessage.react(emojiOptions[4]) })
            .then(async () => { if (count > 5) await sentMessage.react(emojiOptions[5]) })
            .then(async () => { if (count > 6) await sentMessage.react(emojiOptions[6]) })
            .then(async () => { if (count > 7) await sentMessage.react(emojiOptions[7]) })
            .then(async () => { if (count > 8) await sentMessage.react(emojiOptions[8]) })
            .then(async () => { if (count > 9) await sentMessage.react(emojiOptions[9]) })
            .catch(() => console.error('One of the emojis failed to react.'));

        }
        else {
          return message.channel.send('Invalid use of `' + prefix + 'notifications custom`, please try again.');
        }
      }
      else {
        return message.channel.send('You do not have permissions to use `' + prefix + 'notifications custom` in <#' + message.channel.id + '>!');
      }
    } else {
      return message.channel.send("This is to enable custom react roles. You are in charge of creating/deleting the roles. To use it, type: `" + prefix + "notifications custom add @role Optional description of role`");
    }
  },
};
