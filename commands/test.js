module.exports = {
	name: 'test',
	description: 'Testing Stuff',
	usage: '',
	adminCommand: true,
	async execute(message, args, prefix, guildSettings, client, Discord, tautulli, config, fetch, exemptEmbedReactRoles, tautulliHook) {

		let library = await tautulliHook.tautulliService.getLibraries();
		library = library.data;
		let libraryExclusionList;
		var customList = [];

		for (var i = 0; i < library.length; i++) {
			customList.push(library[i].section_name.trim());
			libraryExclusionList = client.getLibraryExclusionSettings.get(`${message.guild.id}-${client.user.id}-${library[i].section_name.trim()}`);
			if (!libraryExclusionList) {
				libraryExclusionList = { id: `${message.guild.id}-${client.user.id}-${library[i].section_name.trim()}`, guild: message.guild.id, name: library[i].section_name.trim(), excluded: "false" };
				client.setLibraryExclusionSettings.run(libraryExclusionList);
				libraryExclusionList = client.getLibraryExclusionSettings.get(`${message.guild.id}-${client.user.id}-${library[i].section_name.trim()}`);
			}
		}

		var customList2 = {};

		var emojiOptions = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
		const filter = (reaction, user) => emojiOptions.indexOf(reaction.emoji.name) != -1;

		var setDescription = "The following libraries can be excluded from recently added notifications:\n";
		exemptEmbedReactRoles.push(`Library Exclusion:`);
		embed = new Discord.RichEmbed()
			.setAuthor('Library Exclusion:') //don't foget to edit exemptEmbedReactRoles above if name changes so it is ignored in index.js role react
			.setTimestamp(new Date())
			.setColor(0x00AE86);

		var count = 0;
		for (const exclusionList of client.searchLibraryExclusionSettings.iterate()) {
			if (exclusionList.excluded === "false") {
				customList2[emojiOptions[count]] = `${exclusionList.name}`;
				setDescription = setDescription + "\n" + `${emojiOptions[count]} ${exclusionList.name}`;
				count++;
			}
		}
		if (count < 1) {
			setDescription = "The following libraries are currently excluded from recently added notifications but can be included:\n";
		}
		var setDescription2 = "";

		for (const exclusionList of client.searchLibraryExclusionSettings.iterate()) {
			if (exclusionList.excluded === "true") {
				customList2[emojiOptions[count]] = `${exclusionList.name}`;
				setDescription2 = setDescription2 + "\n" + `${emojiOptions[count]} ${exclusionList.name}`;
				count++;
			}
		}
		if (setDescription2 != "") {
			setDescription = setDescription + "\n\nThe following libraries are currently excluded from recently added notifications but can be included:\n" + setDescription2;
		}

		if (count < 1) {
			return message.channel.send("No Plex Libraries found, check your tautulli settings.");
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
						collected.tap(selectedOptions => {
							if (selectedOptions.users.get(message.author.id) != undefined) {
								selectedEmojis.push(selectedOptions._emoji.name);
							}
						});

						var excludedItemsList = [];
						var includedItemsList = [];
						var sortedEmojiList = {};

						for (var i = 0; i < selectedEmojis.length; i++) {
							libraryExclusionList = client.getLibraryExclusionSettings.get(`${message.guild.id}-${client.user.id}-${customList2[selectedEmojis[i]]}`);
							if (libraryExclusionList && libraryExclusionList.excluded === "false") {
								libraryExclusionList.excluded = "true";
								excludedItemsList.push(customList2[selectedEmojis[i]]);
							}
							else if (libraryExclusionList && libraryExclusionList.excluded === "true") {
								libraryExclusionList.excluded = "false";
								includedItemsList.push(customList2[selectedEmojis[i]]);
							}
							client.setLibraryExclusionSettings.run(libraryExclusionList);
							libraryExclusionList = client.getLibraryExclusionSettings.get(`${message.guild.id}-${client.user.id}-${customList2[selectedEmojis[i]]}`);
						}

						var setResponseDescription = "";
						embed = new Discord.RichEmbed()
							.setTimestamp(new Date())
							.setColor(0x00AE86);

						if (excludedItemsList.length > 0) {
							setResponseDescription = "**Successfully excluded the following libraries from recently added notifications:**";
							for (var i = 0; i < excludedItemsList.length; i++) {
								setResponseDescription = setResponseDescription + "\n> " + excludedItemsList[i];
							}
							if (includedItemsList.length > 0) {
								setResponseDescription = setResponseDescription + "\n\n**Successfully included the following libraries for recently added notifications:**";
								for (var i = 0; i < includedItemsList.length; i++) {
									setResponseDescription = setResponseDescription + "\n> " + includedItemsList[i];
								}
							}
							embed.setDescription(setResponseDescription);
						}
						else if (includedItemsList.length > 0) {
							setResponseDescription = "**Successfully included the following libraries for recently added notifications:**";
							for (var i = 0; i < includedItemsList.length; i++) {
								setResponseDescription = setResponseDescription + "\n> " + includedItemsList[i];
							}
							embed.setDescription(setResponseDescription);
						}
						else {
							embed = new Discord.RichEmbed()
								.setDescription("Nothing selected in time, no libraries were excluded.")
								.setTimestamp(new Date())
								.setColor(0x00AE86);
						}

						sentMessage.edit({embed});
						tautulliHook.tautulliService.updateTautulliHook();
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
  },
};
