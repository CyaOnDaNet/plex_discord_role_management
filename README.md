# Plex-Discord Role Management and Notifier Bot

## Installation

1. Install Node.js: https://nodejs.org/
2. Clone the repo or download a zip and unpackage it.
3. Navigate to the root folder and in the console, type `npm install`
    * You should see packages beginning to install
4. Once this is complete, go here: https://discordapp.com/developers/applications/me
    1. Log in or create an account
    2. Click **New App**
    3. Fill in App Name and anything else you'd like to include
    4. Click **Create App**
        * This will provide you with your Client ID and Client Secret
    5. Click **Create Bot User**
        * This will provide you with your bot Username and Token
5. Take your bot token from the page and enter it into the `config/config.json` file, replacing the placeholders.
6. Navigate to the `config/config.json` file and replace the placeholders with your Tautulli and Sonarr information. The node_hook_ip and port are referring to the machine running this bot so tautulli knows where to communicate to. If this is all running locally on the same machine you can put `localhost`. The node_hook_port can be any available open port.
7. Once you have the configs set up correctly, you'll need to authorize your bot on a server you have administrative access to.  For documentation, you can read: https://discordapp.com/developers/docs/topics/oauth2#bots.  The steps are as follows:
    1. Go to `https://discordapp.com/api/oauth2/authorize?client_id=[CLIENT_ID]&scope=bot&permissions=1` where [CLIENT_ID] is the Discord App Client ID
    2. Select **Add a bot to a server** and select the server to add it to
    3. Click **Authorize**
    4. You should now see your bot in your server listed as *Offline*
9. To bring your bot *Online*, navigate to the root of the app (where `index.js` is located) and in your console, type `node index.js`
    * This will start your server.  The console will need to be running for the bot to run.

If I am missing any steps, feel free to reach out or open  an issue/bug in the Issues for this repository.

***

## Usage

1. This bot allows a mentionable Role to be set as a watching role for users. It gets auto-assigned during playback and removed when done. This is useful for other notifications, like if you need to reboot the Plex server you can ping @watching so they know it's not a problem on their end. To use this feature, the Discord account must be linked to the plex username with `!link @DiscordUser PlexUsername`. 

2. The second usage for this bot is getting relevant recently added notifications. All recently added movies and TV shows are filtered through the bot to add their respective @mentions and then sent in the specified channel. A user chooses their respective notification settings by clicking on emojis and receiving a react-role form the bot. A library can be excluded with the `!notifications library` command, like with a 4k library that most or all of the other users don't have access to.

***
## Getting Started

1. After all `config/config.json` settings have been applied, the bot has been invited to the server, and the bot is online with no errors in the console; you are ready to configure its settings. First off, if you want to change the prefix, do it with `!bot prefix newprefix` where newprefix is the actual new prefix.

2. In some sort of Admin only channel, do all the following stuff until the last step. We want to run `!link @DiscordUser PlexUsername` for every user in the server, you can verify the settings with `!linklist` and use `!link @DiscordUser` to unlink someone. If you don't know the exact spelling of someone's plex username, the command `!users` will pull a list for you. Now create a Watching Role in Discord and make sure the Mentionable box is ticked. Run this command with the Role you just created `!role @WatchingRole`. Run `!bot logchannel @channel` to get a log of the auto-assigning of the role.

3. Run the `!notifications edit` command to setup some notification preferences now. If you have any custom Roles you would like to be React-Roles (so users can opt in and out of them) use the `!notifications custom add @mentionedRole Optional Description` command. Run `!notifications library` to exclude any libraries from recently added notifications.

4. Test the Sonarr connection and generate the database with `!notifications list`. A database with all shows on Sonarr was just created but only continuing (airing) shows automatically received a discord Role. Now you can edit this list with `!notifications exclude show` or `!notifications include show`. You can even group or ungroup common shows with `!notifications group New Group Name for Shows [show1] [show2] [etc.]` and `!notifications ungroup [show1] [show2] [etc.]`. You can recall `!notifications list` to see your changes and once you are satisfied with this list you can continue onto the final step.

5. We should setup a `#notifications` channel and a `#notifications_settings` channel. In the channel permissions, non-Admin users should be able to read these messages but not be able to send anything. Also, default server notification settings should be set to @mentions only so people are not spammed by `#notifications` but rather only get notifications on things they want. Use `!notifications channel #notifications` to set the bots recently added notifications to go to the newly created channel and head over to `#notification_settings` and type `!notifications list` to generate all the React-Role embeds. You are now done, and people can receive show specific notifications in your Discord Server!

***

## Commands
-  `!help` : Lists information about commands.
-  `!help [command name]` : Lists information about a specific command.
-  `!showlist` :  Lists all the shows on Sonarr that are still marked as continuing.
-  `!bot [subcommand]` : Various bot commands
      - `!bot info` : Lists current info like logging channel, recently added channel, etc.
      - `!bot prefix newprefix` : Allows you to change the bot prefix
      - `!bot logchannel @channel` : Allows you top set the logchannel or turn off logging with `!bot logchannel off`
-  `!link @DiscordUser PlexUsername` : Links a Discord User Tag with their respective Plex username
-  `!unlink @DiscordUser PlexUsername` : Unlinks a Discord User Tag with a Plex username
-  `!linklist` : Shows a list of all linked Plex-Discord Users
-  `!users` : Lists all Plex usernames that have shared access to the  Server, to be used to easily call the `!link @DiscordUser PlexUsername` command.
-  `!notifications [subcommand]` : 
      - `!notifications edit` : Allows you to edit the page 1 react role options.
      - `!notifications custom add @mentionedRole Optional Description` : Allows you to add up to 6 custom React-Roles that can be used on page 1 of the `!notifications list` 
      - `!notifications custom remove` : Allows you to remove a custom React-Role
      - `!notifications library` : Allows you to include or exclude a library from sending recently added notifications. Ex. To exclude a 4k Movie Library from pinging in the `!notifications channel`
      - `!notifications exclude show` : Excludes a show from getting it's own Role
      - `!notifications include show` : Includes a show in getting it's own Role
      - `!notifications group New Group Name for Shows [show1] [show2] [etc.]` : Groups shows as one React-Role
      - `!notifications ungroup [show1] [show2] [etc.]` : Ungroups previously grouped shows.
      - `!notifications list` : Lists the react-role embeds to be used for role specified notifications. Should be called in its own channel that others can view but not send in. For now, it needs to be recalled to reflect new changes.
      - `!notifications channel` : Sets the channel that recently added shows are notified in.
-  `!role @WatchingRole` : Assigns the Watching Role that the bot assigns to Users when they are watching Plex. *NOTE: The Bot's Role needs to be higher than the Watching Role*

***

## To Do:
* [ ] Automate auto-updating of TV show react roles somehow so `!notifications list` doesn't need to be called each time we want to have a new show listed. The problem here is that if I simply edit the existing embeds, people's react-role clicks might be off.

***

## Completed:
* [x] Finished Everything I initially intended this bot to be able to do.

