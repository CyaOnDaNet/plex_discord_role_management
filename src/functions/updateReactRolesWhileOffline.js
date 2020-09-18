module.exports = async(startUp, unenrollFromReactRoleListActive) => {
  const mainProgram = require("../../index.js");
  const client = mainProgram.client;
  const unenrollFromReactRoleList = require('./unenrollFromReactRoleList.js');
  var DEBUG = mainProgram.DEBUG;

	var previousNotifierList = [];
	for (let previousNotifierListObject of client.searchPreviousNotifierList.iterate()) {
		await previousNotifierList.push(previousNotifierListObject);
	}
  for (var x = 0; x < previousNotifierList.length; x++) {
		var channelsWithRole = client.guilds.cache.get(previousNotifierList[x].guild).channels.cache.array();
		channelsWithRole.forEach(function(channel) {
      if (channel.type == "text") {
        channel.messages.fetch(`${previousNotifierList[x].messageID}`)
          .then(async message => {
            var emoji;
            if (message.embeds[0]) {
              if (message.embeds[0].description) {
                if (message.embeds[0].description != undefined && message.embeds[0].description != "" && message.embeds[0].description != null) {
                  var args = message.embeds[0].description.trim().split(/\r?\n/);

                  if (message.embeds[0].author.name == client.newNotificationListAuthorName) {
      							//`❌` was clicked and user wants to unenroll from react role notifications.
      							let reaction = message.reactions.cache.array();
      							for (let i = 0; i < reaction.length; i++) {
      								if (reaction[i].emoji.name === '❌') {
      									let reactions = await reaction[i].users.fetch();
      									if (reactions) {
      										await reactions.each(async user => {
      											if (user.id != client.user.id) {
                              if (startUp) {
                                if (DEBUG == 3) console.log("Unenroll was clicked while offline, processing...");
        												return unenrollFromReactRoleList(message);
                              }
      											}
      										});
      									}
      								}
      							}
      						}
      						else {
      							if (DEBUG == 3) console.log(`Checking message for changes: ${message.id}`)
      							for (var i = 0; i < args.length; i++) {
      	              if (args[i].indexOf("<@&") === -1) continue;       //Invalid React Role Mention Clicked

      	              var emojiKey = args[i].slice(0, args[i].indexOf("<@&")).trim();    //Grab Emoji
      								if (emojiKey.indexOf("|") != -1) {
      									// Clean up emoji key because I added pipes
      									emojiKey = emojiKey.slice(0, emojiKey.indexOf("|")).trim();
      								}
      	              var roleID = args[i].slice(args[i].indexOf("<@&") + 3, args[i].indexOf(">"));
      	              var reaction = await message.reactions.cache.get(emojiKey);
      								if (!reaction) continue;
      	              let reactions = await reaction.users.fetch();
      	              var roleList = [];  //List of users that are supposed to have that role

      	              await reactions.each(async user => {
      	                if (user.id != client.user.id) {
      	                  if (DEBUG == 3) console.log(`updateReactRolesWhileOffline -      User ID: ${user.id}    Username: ${user.username}    Role ID: ${roleID}    Emoji:   ${emojiKey}`);
      	                  roleList.push(user.id);

      										await client.guilds.cache.get(previousNotifierList[i].guild).members.fetch(user.id)
      										  .then(async member => {
      												let preserveredCallbackRoleID = roleID; // needed because it seems that the roleID will sometimes change faster then it can process,
      												let preservedReaction = reaction; // needed because it seems that the reaction will sometimes change faster then it can process,

      												var userRole = await member.roles.cache.get(preserveredCallbackRoleID);

                              if (unenrollFromReactRoleListActive) {
                                // unenroll from react role list is active. the role has yet to be removed from the user but unenrollFromReactRoleList() should take care of that.
                                // we need to remove the users emoji click to prevent the role from being reassigned.
                                if (DEBUG == 3) console.log("Attempting to remove reaction clicks.")
                                await preservedReaction.users.remove(user); // remove emoji click by user
                              }
                              else if (startUp) {
                                /* If we have gotten to this point it means there is a reaction by a user detected during startup that was not the unenroll emoji ❌
                                 * Thus, if they were inactive, they are now not. Also, if they had unenrolled, role reactions would have been wiped already.
                                 * Therefore, the logical thing to do is treat the user as active and add the role.
                                 */

                                let inactiveDatabaseCheck = await client.getNewListInactiveUsers.get(`${message.guild.id}-${user.id}`);
      													if (inactiveDatabaseCheck === undefined || inactiveDatabaseCheck === "" || inactiveDatabaseCheck === null) {
      														// user not in database so create entry
      														inactiveDatabaseCheck = { id: `${message.guild.id}-${user.id}`, guild: `${message.guild.id}`, discordUserID: `${user.id}`, inactive: `false`, wipeRoleReactions: `false` };
      														client.setNewListInactiveUsers.run(inactiveDatabaseCheck);
      														inactiveDatabaseCheck = await client.getNewListInactiveUsers.get(`${message.guild.id}-${user.id}`);
      													}

                                inactiveDatabaseCheck.inactive = "false";
                                inactiveDatabaseCheck.wipeRoleReactions = "false";
                                client.setNewListInactiveUsers.run(inactiveDatabaseCheck);
                                inactiveDatabaseCheck = await client.getNewListInactiveUsers.get(`${message.guild.id}-${user.id}`);

                                if (DEBUG == 3) console.log(`Adding role to ${user.username}:     RoleID: ${preserveredCallbackRoleID}`);
                                let userToModify = message.guild.members.resolve(user.id);
                                userToModify.roles.add(preserveredCallbackRoleID)
                                  .catch(console.error);

                              }
                              else if (userRole === "" || userRole === null || userRole === undefined) {
      													let inactiveDatabaseCheck = await client.getNewListInactiveUsers.get(`${message.guild.id}-${user.id}`);
      													if (inactiveDatabaseCheck === undefined || inactiveDatabaseCheck === "" || inactiveDatabaseCheck === null) {
      														// user not in database so create entry
      														inactiveDatabaseCheck = { id: `${message.guild.id}-${user.id}`, guild: `${message.guild.id}`, discordUserID: `${user.id}`, inactive: `false`, wipeRoleReactions: `false` };
      														client.setNewListInactiveUsers.run(inactiveDatabaseCheck);
      														inactiveDatabaseCheck = await client.getNewListInactiveUsers.get(`${message.guild.id}-${user.id}`);
      													}
      													else if (inactiveDatabaseCheck.inactive == "true" && inactiveDatabaseCheck.wipeRoleReactions != "true") {
      														inactiveDatabaseCheck.inactive = "false";
      														//inactiveDatabaseCheck.wipeRoleReactions = "false"; //not ideal to reset it here but realistically, if they were inactive then they have no roles to clear anyways
      														client.setNewListInactiveUsers.run(inactiveDatabaseCheck);
      														inactiveDatabaseCheck = await client.getNewListInactiveUsers.get(`${message.guild.id}-${user.id}`);
      													}

      													if (inactiveDatabaseCheck.inactive == "true" && inactiveDatabaseCheck.wipeRoleReactions == "true") {
      														if (DEBUG == 3) console.log("Attempting to remove reaction clicks.")
      														await preservedReaction.users.remove(user); // remove emoji click by user
      													}
      													else {
      														if (DEBUG == 3) console.log(`Adding role to ${user.username}:     RoleID: ${preserveredCallbackRoleID}`);
      														let userToModify = message.guild.members.resolve(user.id);
      													  userToModify.roles.add(preserveredCallbackRoleID)
      													    .catch(console.error);
      													}
      												}
      												else {
      													if (DEBUG == 3)  {
      														if (userRole.name) {
      															console.log(`Role is already on ${user.username}: ${userRole.name}     ID: ${userRole.id}`);
      														}
      														else {
      															console.log(`Name did not exist, role info is below:`);
      															console.log(userRole.name);
      														}
      													}
      												}
      											});
      	                }
      	              });

      	              var roleUser = await client.guilds.cache.get(previousNotifierList[i].guild).roles.resolve(roleID).members.each(async member => {
      	                var removeRole = true;
      	                for (var i = 0; i < roleList.length; i++) {
      	                  if (member.id == client.user.id || member.id == roleList[i]) {
      	                    removeRole = false;
      	                  }
      	                }
      	                if (removeRole) {
      										let inactiveDatabaseCheck = await client.getNewListInactiveUsers.get(`${message.guild.id}-${member.id}`);
      										if (inactiveDatabaseCheck === undefined || inactiveDatabaseCheck === "" || inactiveDatabaseCheck === null) {
      											// user not in database so create entry
      											inactiveDatabaseCheck = { id: `${message.guild.id}-${member.id}`, guild: `${message.guild.id}`, discordUserID: `${member.id}`, inactive: `true`, wipeRoleReactions: `false` };
      											client.setNewListInactiveUsers.run(inactiveDatabaseCheck);
      										}
      										else if (inactiveDatabaseCheck.inactive == "false") {
      											// user is actively clicking new react role page and made changes since offline, remove those roles.
      											if (DEBUG == 3) console.log(`Removing role from User: ${member.user.username}     ID: ${roleID}`);
      		                  let userToModify = message.guild.members.resolve(member.id);
      		                  userToModify.roles.remove(roleID)
      		                    .catch(console.error);
      										}
      	                }
      	              });
      	            }
      						}
                }
              }
            }
          })
          .catch(function(error) {
            if (error.code == 10008) {
              //unknown message, therefore not the right channel, do not log this.
            }
            else {
              console.log(error);
            }
          });
      }
    });
  }
}
