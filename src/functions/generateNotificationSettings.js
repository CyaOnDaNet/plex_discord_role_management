module.exports = async(message, client) => {
  let notificationSettings;

	notificationSettings = client.getNotificationSettings.get(`${message.guild.id}-${client.user.id}-All Movies`);
	if (!notificationSettings) {
		notificationSettings = { id: `${message.guild.id}-${client.user.id}-All Movies`, guild: message.guild.id, name: `All Movies`, category: `movies`, description: `Every movie added to Plex`, roleID: null };
		client.setNotificationSettings.run(notificationSettings);
	}

	notificationSettings = client.getNotificationSettings.get(`${message.guild.id}-${client.user.id}-New Movies`);
	if (!notificationSettings) {
		notificationSettings = { id: `${message.guild.id}-${client.user.id}-New Movies`, guild: message.guild.id, name: `New Movies`, category: `movies`, description: `Movies released within the last 9 months`, roleID: null };
		client.setNotificationSettings.run(notificationSettings);
	}

	notificationSettings = client.getNotificationSettings.get(`${message.guild.id}-${client.user.id}-All TV Episodes`);
	if (!notificationSettings) {
		notificationSettings = { id: `${message.guild.id}-${client.user.id}-All TV Episodes`, guild: message.guild.id, name: `All TV Episodes`, category: `tv`, description: `Every TV episode!`, roleID: null };
		client.setNotificationSettings.run(notificationSettings);
	}

	notificationSettings = client.getNotificationSettings.get(`${message.guild.id}-${client.user.id}-New TV Shows`);
	if (!notificationSettings) {
		notificationSettings = { id: `${message.guild.id}-${client.user.id}-New TV Shows`, guild: message.guild.id, name: `New TV Shows`, category: `tv`, description: `New shows added to Plex`, roleID: null };
		client.setNotificationSettings.run(notificationSettings);
	}

	notificationSettings = client.getNotificationSettings.get(`${message.guild.id}-${client.user.id}-ABC (US)`);
	if (!notificationSettings) {
		notificationSettings = { id: `${message.guild.id}-${client.user.id}-ABC (US)`, guild: message.guild.id, name: `ABC (US)`, category: `networks`, description: ``, roleID: null };
		client.setNotificationSettings.run(notificationSettings);
	}

	notificationSettings = client.getNotificationSettings.get(`${message.guild.id}-${client.user.id}-Amazon`);
	if (!notificationSettings) {
		notificationSettings = { id: `${message.guild.id}-${client.user.id}-Amazon`, guild: message.guild.id, name: `Amazon`, category: `networks`, description: ``, roleID: null };
		client.setNotificationSettings.run(notificationSettings);
	}

	notificationSettings = client.getNotificationSettings.get(`${message.guild.id}-${client.user.id}-Disney+`);
	if (!notificationSettings) {
		notificationSettings = { id: `${message.guild.id}-${client.user.id}-Disney+`, guild: message.guild.id, name: `Disney+`, category: `networks`, description: ``, roleID: null };
		client.setNotificationSettings.run(notificationSettings);
	}

	notificationSettings = client.getNotificationSettings.get(`${message.guild.id}-${client.user.id}-CBS`);
	if (!notificationSettings) {
		notificationSettings = { id: `${message.guild.id}-${client.user.id}-CBS`, guild: message.guild.id, name: `CBS`, category: `networks`, description: ``, roleID: null };
		client.setNotificationSettings.run(notificationSettings);
	}

	notificationSettings = client.getNotificationSettings.get(`${message.guild.id}-${client.user.id}-FOX`);
	if (!notificationSettings) {
		notificationSettings = { id: `${message.guild.id}-${client.user.id}-FOX`, guild: message.guild.id, name: `FOX`, category: `networks`, description: ``, roleID: null };
		client.setNotificationSettings.run(notificationSettings);
	}

	notificationSettings = client.getNotificationSettings.get(`${message.guild.id}-${client.user.id}-HBO`);
	if (!notificationSettings) {
		notificationSettings = { id: `${message.guild.id}-${client.user.id}-HBO`, guild: message.guild.id, name: `HBO`, category: `networks`, description: ``, roleID: null };
		client.setNotificationSettings.run(notificationSettings);
	}

	notificationSettings = client.getNotificationSettings.get(`${message.guild.id}-${client.user.id}-NBC`);
	if (!notificationSettings) {
		notificationSettings = { id: `${message.guild.id}-${client.user.id}-NBC`, guild: message.guild.id, name: `NBC`, category: `networks`, description: ``, roleID: null };
		client.setNotificationSettings.run(notificationSettings);
	}

	notificationSettings = client.getNotificationSettings.get(`${message.guild.id}-${client.user.id}-Netflix`);
	if (!notificationSettings) {
		notificationSettings = { id: `${message.guild.id}-${client.user.id}-Netflix`, guild: message.guild.id, name: `Netflix`, category: `networks`, description: ``, roleID: null };
		client.setNotificationSettings.run(notificationSettings);
	}

	notificationSettings = client.getNotificationSettings.get(`${message.guild.id}-${client.user.id}-Showtime`);
	if (!notificationSettings) {
		notificationSettings = { id: `${message.guild.id}-${client.user.id}-Showtime`, guild: message.guild.id, name: `Showtime`, category: `networks`, description: ``, roleID: null };
		client.setNotificationSettings.run(notificationSettings);
	}

	notificationSettings = client.getNotificationSettings.get(`${message.guild.id}-${client.user.id}-The CW`);
	if (!notificationSettings) {
		notificationSettings = { id: `${message.guild.id}-${client.user.id}-The CW`, guild: message.guild.id, name: `The CW`, category: `networks`, description: ``, roleID: null };
		client.setNotificationSettings.run(notificationSettings);
	}
}
