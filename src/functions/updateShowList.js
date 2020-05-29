module.exports = async(message, client) => {
  // grabs list of currently airing shows and adds them to notifications channel
	const mainProgram = require("../../index.js");
  var sonarr = mainProgram.sonarr;

	let tvShowsNotificationSettings;
  var json;
  for (let sonarrInstance in sonarr) {
    var tempJSON = await sonarr[sonarrInstance].getSeries();
    if (tempJSON == "error") {
  		return console.log("Couldn't connect to Sonarr, check your settings.");
  	}
    else {
      if (json === "" || json === null || json === undefined) json = tempJSON;
      else json = json.concat(tempJSON);  // join all sonarr instace results together
    }
  }
  // Let's remove any duplicate shows that are on multiple sonarr instances
  var tempJSON = [];
  for (var i = 0; i < json.length; i++) {
    var found = false;
    for (var j = 0; j < tempJSON.length; j++) {
      if (tempJSON[j].title == json[i].title && tempJSON[j].tvdbId == json[i].tvdbId && tempJSON[j].imdbId == json[i].imdbId) {
        found = true;
        break;
      }
    }
    if (!found) {
      tempJSON.push(json[i]);
    }
  }
  json = tempJSON;

	let showsList = [];
	var count = 0;
  var roleLimitHit = false;
	for (var i = 0; i < json.length; i++) {
		if (json[i].status === "continuing") {
			// Create an Entry for the show in the database
			showsList[count] = json[i].title;
			tvShowsNotificationSettings = client.getTvShowsNotificationSettings.get(`${json[i].cleanTitle}-${json[i].imdbId}-${message.guild.id}`);

			if (!tvShowsNotificationSettings) {
				// Create a new role with data
				var role = await message.guild.roles.cache.find(role => role.name === json[i].title);

				if (role) {
					tvShowsNotificationSettings = { id: `${json[i].cleanTitle}-${json[i].imdbId}-${message.guild.id}`, guild: message.guild.id, title: json[i].title, cleanTitle: json[i].cleanTitle, sortTitle: json[i].sortTitle, imdbID_or_themoviedbID: json[i].imdbId, thetvdb_id: `${json[i].tvdbId}`, status: json[i].status, is_group: null, groupName: null, groupRole: null, exclude: null, include: null, network: json[i].network, completeSonarr: JSON.stringify(json[i]), roleID: role.id};
					client.setTvShowsNotificationSettings.run(tvShowsNotificationSettings);
					tvShowsNotificationSettings = client.getTvShowsNotificationSettings.get(`${json[i].cleanTitle}-${json[i].imdbId}-${message.guild.id}`);
				}
				else if (!roleLimitHit) {
					let newRole = await message.guild.roles.create({
						data: {
							name: json[i].title,
							color: 'BLUE',
							mentionable: true
						}
					})
						.then(role => {
							//console.log(`Created new role with name ${role.name} and color ${role.color}`)
							tvShowsNotificationSettings = { id: `${json[i].cleanTitle}-${json[i].imdbId}-${message.guild.id}`, guild: message.guild.id, title: json[i].title, cleanTitle: json[i].cleanTitle, sortTitle: json[i].sortTitle, imdbID_or_themoviedbID: json[i].imdbId, thetvdb_id: `${json[i].tvdbId}`, status: json[i].status, is_group: null, groupName: null, groupRole: null, exclude: null, include: null, network: json[i].network, completeSonarr: JSON.stringify(json[i]), roleID: role.id};
							client.setTvShowsNotificationSettings.run(tvShowsNotificationSettings);
							tvShowsNotificationSettings = client.getTvShowsNotificationSettings.get(`${json[i].cleanTitle}-${json[i].imdbId}-${message.guild.id}`);
						})
						.catch(function(error) {
              if (error.code == 30005) {
                //Max Role Count on Server Hit
                if (!roleLimitHit) {
                  console.log(error);
                }
                tvShowsNotificationSettings = { id: `${json[i].cleanTitle}-${json[i].imdbId}-${message.guild.id}`, guild: message.guild.id, title: json[i].title, cleanTitle: json[i].cleanTitle, sortTitle: json[i].sortTitle, imdbID_or_themoviedbID: json[i].imdbId, thetvdb_id: `${json[i].tvdbId}`, status: json[i].status, is_group: null, groupName: null, groupRole: null, exclude: null, include: null, network: json[i].network, completeSonarr: JSON.stringify(json[i]), roleID: null};
  							client.setTvShowsNotificationSettings.run(tvShowsNotificationSettings);
  							tvShowsNotificationSettings = client.getTvShowsNotificationSettings.get(`${json[i].cleanTitle}-${json[i].imdbId}-${message.guild.id}`);
                roleLimitHit = true;
              }
              else {
                console.log(error);
              }
            });
				}
        else {
          tvShowsNotificationSettings = { id: `${json[i].cleanTitle}-${json[i].imdbId}-${message.guild.id}`, guild: message.guild.id, title: json[i].title, cleanTitle: json[i].cleanTitle, sortTitle: json[i].sortTitle, imdbID_or_themoviedbID: json[i].imdbId, thetvdb_id: `${json[i].tvdbId}`, status: json[i].status, is_group: null, groupName: null, groupRole: null, exclude: null, include: null, network: json[i].network, completeSonarr: JSON.stringify(json[i]), roleID: null};
          client.setTvShowsNotificationSettings.run(tvShowsNotificationSettings);
          tvShowsNotificationSettings = client.getTvShowsNotificationSettings.get(`${json[i].cleanTitle}-${json[i].imdbId}-${message.guild.id}`);
        }
			}
      else if (tvShowsNotificationSettings.guild == message.guild.id && tvShowsNotificationSettings.roleID === null && tvShowsNotificationSettings.exclude === null && tvShowsNotificationSettings.groupRole === null && tvShowsNotificationSettings.is_group === null && tvShowsNotificationSettings.groupName === null) {
        // Create a new role with data
				var role = await message.guild.roles.cache.find(role => role.name === json[i].title);

				if (role) {
					tvShowsNotificationSettings.roleID = role.id;
          client.setTvShowsNotificationSettings.run(tvShowsNotificationSettings);
					tvShowsNotificationSettings = client.getTvShowsNotificationSettings.get(`${json[i].cleanTitle}-${json[i].imdbId}-${message.guild.id}`);
				}
				else if (!roleLimitHit) {
					let newRole = await message.guild.roles.create({
						data: {
							name: json[i].title,
							color: 'BLUE',
							mentionable: true
						}
					})
						.then(role => {
							tvShowsNotificationSettings.roleID = role.id;
							client.setTvShowsNotificationSettings.run(tvShowsNotificationSettings);
							tvShowsNotificationSettings = client.getTvShowsNotificationSettings.get(`${json[i].cleanTitle}-${json[i].imdbId}-${message.guild.id}`);
						})
						.catch(function(error) {
              if (error.code == 30005) {
                //Max Role Count on Server Hit
                if (!roleLimitHit) {
                  console.log(error);
                }
                roleLimitHit = true;
              }
              else {
                console.log(error);
              }
            });
				}
      }
      count++;
		}
		else {
			// Delete an Entry for the show in the database
			tvShowsNotificationSettings = client.getTvShowsNotificationSettings.get(`${json[i].cleanTitle}-${json[i].imdbId}-${message.guild.id}`);

			if (tvShowsNotificationSettings && tvShowsNotificationSettings.is_group === null && tvShowsNotificationSettings.include === null && tvShowsNotificationSettings.roleID != null) {
        if (await message.guild.roles.cache.find(role => role.id === tvShowsNotificationSettings.roleID) != null) {
          await message.guild.roles.cache.find(role => role.id === tvShowsNotificationSettings.roleID).delete()
  					.then(async () => {
  						tvShowsNotificationSettings.roleID = null;
  						tvShowsNotificationSettings.status = json[i].status;
  						client.setTvShowsNotificationSettings.run(tvShowsNotificationSettings);
  						tvShowsNotificationSettings = client.getTvShowsNotificationSettings.get(`${json[i].cleanTitle}-${json[i].imdbId}-${message.guild.id}`);
  					})
  					.catch(console.error);
        }
        else {
          tvShowsNotificationSettings.roleID = null;
          tvShowsNotificationSettings.status = json[i].status;
          client.setTvShowsNotificationSettings.run(tvShowsNotificationSettings);
          tvShowsNotificationSettings = client.getTvShowsNotificationSettings.get(`${json[i].cleanTitle}-${json[i].imdbId}-${message.guild.id}`);
        }
			}
			else if (tvShowsNotificationSettings && tvShowsNotificationSettings.is_group === null && tvShowsNotificationSettings.include != null && tvShowsNotificationSettings.roleID === null) {
				// Create a new role with data
				var role = await message.guild.roles.cache.find(role => role.name === json[i].title);

				if (role) {
					tvShowsNotificationSettings.roleID = role.id;
					client.setTvShowsNotificationSettings.run(tvShowsNotificationSettings);
					tvShowsNotificationSettings = client.getTvShowsNotificationSettings.get(`${json[i].cleanTitle}-${json[i].imdbId}-${message.guild.id}`);
				}
				else if (!roleLimitHit) {
					let newRole = await message.guild.roles.create({
						data: {
							name: json[i].title,
							color: 'BLUE',
							mentionable: true
						}
					})
						.then(role => {
							tvShowsNotificationSettings.roleID = role.id;
							client.setTvShowsNotificationSettings.run(tvShowsNotificationSettings);
							tvShowsNotificationSettings = client.getTvShowsNotificationSettings.get(`${json[i].cleanTitle}-${json[i].imdbId}-${message.guild.id}`);
						})
            .catch(function(error) {
              if (error.code == 30005) {
                //Max Role Count on Server Hit
                if (!roleLimitHit) {
                  console.log(error);
                }
                roleLimitHit = true;
              }
              else {
                console.log(error);
              }
            });
				}
			}
			else if (!tvShowsNotificationSettings) {
				tvShowsNotificationSettings = { id: `${json[i].cleanTitle}-${json[i].imdbId}-${message.guild.id}`, guild: message.guild.id, title: json[i].title, cleanTitle: json[i].cleanTitle, sortTitle: json[i].sortTitle, imdbID_or_themoviedbID: json[i].imdbId, thetvdb_id: `${json[i].tvdbId}`, status: json[i].status, is_group: null, groupName: null, groupRole: null, exclude: null, include: null, network: json[i].network, completeSonarr: JSON.stringify(json[i]), roleID: null};
				client.setTvShowsNotificationSettings.run(tvShowsNotificationSettings);
				tvShowsNotificationSettings = client.getTvShowsNotificationSettings.get(`${json[i].cleanTitle}-${json[i].imdbId}-${message.guild.id}`);
			}
		}
	}
	return showsList;
}
