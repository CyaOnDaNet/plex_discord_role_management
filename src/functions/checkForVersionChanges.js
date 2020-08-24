module.exports = async() => {
	// The isPositiveInteger and compareVersionNumbers was taken from the internet off a quick google search, the URL's are referenced below.

  var pjson = require('../../package.json');
  const Discord = require('discord.js');
  const mainProgram = require("../../index.js");
  const client = mainProgram.client;

	let guilds = [];
	let alertedConsole = false;  // Used to prevent duplicate messages in the logs if bot isin multiple servers

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

	// The isPositiveInteger and compareVersionNumbers was taken from the internet off a quick google search, the URL's are referenced below.

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
