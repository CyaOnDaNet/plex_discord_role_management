module.exports = async(client, sql) => {
  // Check if the table "guildSettings" exists.
  const tableGuildSettings = sql.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'guildSettings';").get();
  if (!tableGuildSettings['count(*)']) {
    // If the table isn't there`, create it and setup the database correctly.
    sql.prepare("CREATE TABLE guildSettings (id TEXT PRIMARY KEY, guild TEXT, prefix TEXT, logChannel TEXT, logChannelBoolean TEXT, notificationChannel TEXT, notificationChannelBoolean TEXT, adminRole TEXT, watchingRole TEXT, customRoleCount INTEGER);").run();
    // Ensure that the "id" row is always unique and indexed.
    sql.prepare("CREATE UNIQUE INDEX idx_guildSettings_id ON guildSettings (id);").run();
    sql.pragma("synchronous = 1");
    sql.pragma("journal_mode = wal");
  }

  // And then we have prepared statements to get and set guildSettings data.
  client.getGuildSettings = sql.prepare("SELECT * FROM guildSettings WHERE guild = ?");
  client.searchGuildSettings = sql.prepare("SELECT * FROM guildSettings");
  client.setGuildSettings = sql.prepare("INSERT OR REPLACE INTO guildSettings (id, guild, prefix, logChannel, logChannelBoolean, notificationChannel, notificationChannelBoolean, adminRole, watchingRole, customRoleCount) VALUES (@id, @guild, @prefix, @logChannel, @logChannelBoolean, @notificationChannel, @notificationChannelBoolean, @adminRole, @watchingRole, @customRoleCount);");

  // Check if the table "userList" exists.
  const tableUserList = sql.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'userList';").get();
  if (!tableUserList['count(*)']) {
    // If the table isn't there, create it and setup the database correctly.
    sql.prepare("CREATE TABLE userList (id TEXT PRIMARY KEY, guild TEXT, discordUserID TEXT, plexUserName TEXT, watching TEXT);").run();
    // Ensure that the "id" row is always unique and indexed.
    sql.prepare("CREATE UNIQUE INDEX idx_userList_id ON userList (id);").run();
    sql.pragma("synchronous = 1");
    sql.pragma("journal_mode = wal");
  }

  // And then we have prepared statements to get and set userList data.
  client.getLinkByID = sql.prepare("SELECT * FROM userList WHERE id = ?");
  client.getLinkByDiscordUserID = sql.prepare("SELECT * FROM userList WHERE discordUserID = ?");
  client.getLinkByPlexUserName = sql.prepare("SELECT * FROM userList WHERE plexUserName = ?");
  client.searchGuildUserList = sql.prepare("SELECT * FROM userList");
  client.setUserList = sql.prepare("INSERT OR REPLACE INTO userList (id, guild, discordUserID, plexUserName, watching) VALUES (@id, @guild, @discordUserID, @plexUserName, @watching);");

  // Check if the table "tvShowsNotificationSettings" exists.
  const tableTvShowsNotificationSettings = sql.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'tvShowsNotificationSettings';").get();
  if (!tableTvShowsNotificationSettings['count(*)']) {
    // If the table isn't there, create it and setup the database correctly.
    sql.prepare("CREATE TABLE tvShowsNotificationSettings (id TEXT PRIMARY KEY, guild TEXT, title TEXT, cleanTitle TEXT, sortTitle TEXT, imdbID_or_themoviedbID TEXT, thetvdb_id TEXT, status TEXT, is_group TEXT, groupName TEXT, groupRole TEXT, exclude TEXT, include TEXT, network TEXT, completeSonarr TEXT, roleID TEXT);").run();
    // Ensure that the "id" row is always unique and indexed.
    sql.prepare("CREATE UNIQUE INDEX idx_tvShowsNotificationSettings_id ON tvShowsNotificationSettings (id);").run();
    sql.pragma("synchronous = 1");
    sql.pragma("journal_mode = wal");
  }

  // And then we have prepared statements to get and set tvShowsNotificationSettings data.
	client.deleteTvShowsNotificationSettings = sql.prepare("DELETE FROM tvShowsNotificationSettings WHERE id = ?");
  client.getTvShowsNotificationSettings = sql.prepare("SELECT * FROM tvShowsNotificationSettings WHERE id = ?");
  client.searchTvShowsNotificationSettings = sql.prepare("SELECT * FROM tvShowsNotificationSettings");
	client.getTvShowsByIMDB = sql.prepare("SELECT * FROM tvShowsNotificationSettings WHERE imdbID_or_themoviedbID = ?");
	client.getTvShowsByTHETVDB = sql.prepare("SELECT * FROM tvShowsNotificationSettings WHERE thetvdb_id = ?");
  client.getTvShowsNotificationSettingsBySortTitle = sql.prepare("SELECT * FROM tvShowsNotificationSettings WHERE sortTitle = ?");
  client.getTvShowsNotificationSettingsByGroupName = sql.prepare("SELECT * FROM tvShowsNotificationSettings WHERE groupName = ?");
  client.setTvShowsNotificationSettings = sql.prepare("INSERT OR REPLACE INTO tvShowsNotificationSettings (id, guild, title, cleanTitle, sortTitle, imdbID_or_themoviedbID, thetvdb_id, status, is_group, groupName, groupRole, exclude, include, network, completeSonarr, roleID) VALUES (@id, @guild, @title, @cleanTitle, @sortTitle, @imdbID_or_themoviedbID, @thetvdb_id, @status, @is_group, @groupName, @groupRole, @exclude, @include, @network, @completeSonarr, @roleID);");

	// Check if the table "notificationSettings" exists.
  const tableNotificationSettings = sql.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'notificationSettings';").get();
  if (!tableNotificationSettings['count(*)']) {
    // If the table isn't there, create it and setup the database correctly.
    sql.prepare("CREATE TABLE notificationSettings (id TEXT PRIMARY KEY, guild TEXT, name TEXT, category TEXT, description TEXT, roleID TEXT);").run();
    // Ensure that the "id" row is always unique and indexed.
    sql.prepare("CREATE UNIQUE INDEX idx_notificationSettings_id ON notificationSettings (id);").run();
    sql.pragma("synchronous = 1");
    sql.pragma("journal_mode = wal");
  }

  // And then we have prepared statements to get and set notificationSettings data.
	client.deleteNotificationSettings = sql.prepare("DELETE FROM notificationSettings WHERE id = ?");
  client.getNotificationSettings = sql.prepare("SELECT * FROM notificationSettings WHERE id = ?");
  client.searchNotificationSettings = sql.prepare("SELECT * FROM notificationSettings");
  client.setNotificationSettings = sql.prepare("INSERT OR REPLACE INTO notificationSettings (id, guild, name, category, description, roleID) VALUES (@id, @guild, @name, @category, @description, @roleID);");

	// Check if the table "libraryExclusion" exists.
  const tableLibraryExclusion = sql.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'libraryExclusion';").get();
  if (!tableLibraryExclusion['count(*)']) {
    // If the table isn't there, create it and setup the database correctly.
    sql.prepare("CREATE TABLE libraryExclusion (id TEXT PRIMARY KEY, guild TEXT, name TEXT, excluded TEXT);").run();
    // Ensure that the "id" row is always unique and indexed.
    sql.prepare("CREATE UNIQUE INDEX idx_libraryExclusion_id ON libraryExclusion (id);").run();
    sql.pragma("synchronous = 1");
    sql.pragma("journal_mode = wal");
  }

  // And then we have prepared statements to get and set libraryExclusion data.
	client.deleteLibraryExclusionEntry = sql.prepare("DELETE FROM libraryExclusion WHERE id = ?");
  client.getLibraryExclusionSettings = sql.prepare("SELECT * FROM libraryExclusion WHERE id = ?");
  client.searchLibraryExclusionSettings = sql.prepare("SELECT * FROM libraryExclusion");
  client.setLibraryExclusionSettings = sql.prepare("INSERT OR REPLACE INTO libraryExclusion (id, guild, name, excluded) VALUES (@id, @guild, @name, @excluded);");

  // Check if the table "previousNotifierList" exists.
  const previousNotifierList = sql.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'previousNotifierList';").get();
  if (!previousNotifierList['count(*)']) {
    // If the table isn't there, create it and setup the database correctly.
    sql.prepare("CREATE TABLE previousNotifierList (id TEXT PRIMARY KEY, guild TEXT, messageID TEXT);").run();
    // Ensure that the "id" row is always unique and indexed.
    sql.prepare("CREATE UNIQUE INDEX idx_previousNotifierList_id ON previousNotifierList (id);").run();
    sql.pragma("synchronous = 1");
    sql.pragma("journal_mode = wal");
  }

  // And then we have prepared statements to get and set previousNotifierList data.
	client.clearPreviousNotifierList = sql.prepare("DELETE FROM previousNotifierList WHERE guild = ?");
	client.deletePreviousNotifier = sql.prepare("DELETE FROM previousNotifierList WHERE id = ?");
  client.getPreviousNotifierList = sql.prepare("SELECT * FROM previousNotifierList WHERE id = ?");
  client.searchPreviousNotifierList = sql.prepare("SELECT * FROM previousNotifierList");
  client.setPreviousNotifierList = sql.prepare("INSERT OR REPLACE INTO previousNotifierList (id, guild, messageID) VALUES (@id, @guild, @messageID);");

}