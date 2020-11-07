module.exports = async() => {
	// The isPositiveInteger() and compareVersionNumbers() functions were taken from the internet off a quick google search, the URL's are referenced below.

  var pjson = require('../../package.json');
  const Discord = require('discord.js');
  const mainProgram = require("../../index.js");
  const client = mainProgram.client;

	let guilds = [];
	let alertedConsole = false;  // Used to prevent duplicate messages in the logs if bot is in multiple servers

	for (const guildSettings of client.searchGuildSettings.iterate()) {
		guilds.push(guildSettings);
	}

	for (let i = 0; i < guilds.length; i++) {
		let guildSettings = guilds[i];
		if (guildSettings.botVersion == null || guildSettings.botVersion == undefined || guildSettings.botVersion == "") {
			guildSettings.botVersion = "0.0.1"; // This database setting did not exist because it was added in version 2.0.0; we need a valid number to compare from.
			client.setGuildSettings.run(guildSettings);
      guildSettings = client.getGuildSettings.get(guilds[i].guild);
		}

    if (guildSettings.recentlyAddedBoolean == null || guildSettings.recentlyAddedBoolean == undefined || guildSettings.recentlyAddedBoolean == "") {
			guildSettings.recentlyAddedBoolean = "on"; // This database setting did not exist because it was added in version 2.0.0; we need a valid setting.
			client.setGuildSettings.run(guildSettings);
      guildSettings = client.getGuildSettings.get(guilds[i].guild);
		}

    if (guildSettings.listCreationActive == null || guildSettings.listCreationActive == undefined || guildSettings.listCreationActive == "") {
			guildSettings.listCreationActive = "off"; // This database setting did not exist because it was added in version 2.0.0; we need a valid setting.
			client.setGuildSettings.run(guildSettings);
      guildSettings = client.getGuildSettings.get(guilds[i].guild);
		}

		let compare = await compareVersionNumbers(pjson.version, guildSettings.botVersion);
		let versionMessage = "";

		switch (compare) {
		  case -1:
		    // Negative if v1 < v2; This means a downgrade occured
				versionMessage = `The bot was downgraded from \`v${guildSettings.botVersion}\` to \`v${pjson.version}\`! You may need to restore an older database version for the bot to function properly.`;

				alertConsole(versionMessage);
				sendChangelogNotification(versionMessage);
				updateVersionColumn();
		    break;
		  case 0:
		    // Version numbers are identical; Do nothing.
				alertConsole(`Running bot v${pjson.version}`);
		    break;
		  case 1:
		    // positive if v1 > v2; This means an upgrade occured
				versionMessage = `The bot was upgraded from \`v${guildSettings.botVersion}\` to \`v${pjson.version}!\``;

        let memberIntentNotifyCheck = await compareVersionNumbers(`2.0.1`, pjson.version);
        switch (memberIntentNotifyCheck) {
          case -1:
            // Negative if v1 < v2; This means the current version running is greater than v2.0.1
            // Now lets check if the old version was below v2.0.1.
            let memberIntentNotify = await compareVersionNumbers(`2.0.1`, guildSettings.botVersion);
            switch (memberIntentNotify) {
              case 0:
                // Version numbers are identical; This means we used to be on v2.0.1 and upgraded higher. Continue on.
              case 1:
                // positive if v1 > v2; This means the old version was below v2.0.1. We need to send a DM to the owner telling them about intent changes
                client.fetchApplication()
                  .then(async (clientApp) => {
                    clientApp.owner.createDM()
                      .then(async (dmChannel) => {
                        //send message
                        let messsage = "Sorry to bother you and thanks for using this bot!\n\n With `discord.js v12`, privileged gateway intents for server members were introduced. What this means for you is that the `@Watching` role will no longer work until you edit your bot to have the server members intent. The instructions to do so are below:\n\n> **1.** Login to the [Discord Developer Portal](https://discord.com/developers/applications)\n> **2.** Go to `Applications` in the sidebar.\n> **3.** Find this bot and click on it. \n> **4.** Click on `Bot` under the settings sidebar. \n> **5.** Look for the `Privileged Gateway Intents` section.\n> **6.** Check the box for `SERVER MEMBERS INTENT`\n> **7.** Check the box for `PRESENCE INTENT` <- (**Optional Step!** *The bot does not use this yet but if you enable it now and I use it later you won't have to worry.*)\n> **8.** Click **Save Changes** on the bottom of the page.\n> **9.** Restart the bot to ensure changes take effect.";

                    		let embed = new Discord.MessageEmbed()
                    			.setTitle("⚠️ Important Notice ⚠️")
                    			.setDescription(messsage)
                    			.setImage('https://i.imgur.com/ZEVVvJ7.png')
                    			.setFooter(`Bot Updated to v${pjson.version}`)
                    			.setTimestamp(new Date())
                    			.setColor(0x00AE86);

                        dmChannel.send({embed: embed});
                      })
                      .catch(console.error);
                  })
                  .catch(console.error);
                break;
              }
            break;
        }

				alertConsole(versionMessage);
				sendChangelogNotification(versionMessage);
				updateVersionColumn();
		    break;
		  case NaN:
		    // Nan if they in the wrong format
			default:
	      //Something Weird Happened
				if (!alertedConsole) {
					console.log("An invalid version number was detected in the database, attempting to store a valid version number!");
					alertedConsole = true;
				}
				updateVersionColumn();
		}

		function updateVersionColumn() {
			guildSettings.botVersion = pjson.version;
			client.setGuildSettings.run(guildSettings);
			guildSettings = client.getGuildSettings.get(guilds[i].guild);
		}

		function alertConsole(versionMessage) {
			if (!alertedConsole) {
				console.log(`${versionMessage}`);
				alertedConsole = true;
			}
		}

		function sendChangelogNotification(message) {
			if (guildSettings.changelogChannelBoolean == "on") {
				// form embed and send
				embed = new Discord.MessageEmbed()
				  .setAuthor(`Version Change!`)
					.setTitle(`${message}`)
					.setURL(pjson.homepage)
					.setTimestamp(new Date())
					.setColor(0x00AE86);

				if (pjson.changeLog) embed.setDescription(`${pjson.changeLog}`);
				else embed.setDescription(`No change log found`);

				client.guilds.cache.get(guildSettings.guild).channels.resolve(guildSettings.changelogChannel).send({embed}).catch(console.error);
			}
		}
	}

	// The isPositiveInteger() and compareVersionNumbers() functions were taken from the internet off a quick google search, the URL's are referenced below.

	function isPositiveInteger(x) {
	    // http://stackoverflow.com/a/1019526/11236
	    return /^\d+$/.test(x);
	}

	/**
	 * Compare two software version numbers (e.g. 1.7.1)
	 * Returns:
	 *
	 *  0 if they're identical
	 *  negative if v1 < v2
	 *  positive if v1 > v2
	 *  Nan if they in the wrong format
	 *
	 *  E.g.:
	 *
	 *  assert(version_number_compare("1.7.1", "1.6.10") > 0);
	 *  assert(version_number_compare("1.7.1", "1.7.10") < 0);
	 *
	 *  "Unit tests": http://jsfiddle.net/ripper234/Xv9WL/28/
	 *
	 *  Taken from http://stackoverflow.com/a/6832721/11236
	 */
	function compareVersionNumbers(v1, v2){
	    var v1parts = v1.split('.');
	    var v2parts = v2.split('.');

	    // First, validate both numbers are true version numbers
	    function validateParts(parts) {
	        for (var i = 0; i < parts.length; ++i) {
	            if (!isPositiveInteger(parts[i])) {
	                return false;
	            }
	        }
	        return true;
	    }
	    if (!validateParts(v1parts) || !validateParts(v2parts)) {
	        return NaN;
	    }

	    for (var i = 0; i < v1parts.length; ++i) {
	        if (v2parts.length === i) {
	            return 1;
	        }

	        if (v1parts[i] === v2parts[i]) {
	            continue;
	        }
	        if (v1parts[i] > v2parts[i]) {
	            return 1;
	        }
	        return -1;
	    }

	    if (v1parts.length != v2parts.length) {
	        return -1;
	    }
	    return 0;
	}
}
