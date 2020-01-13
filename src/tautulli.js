const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const axios = require('axios');
const jtfd = require("json-to-form-data");

const mainProgram = require("../index.js");
const config = require("../config/config.json");
const apiName = 'Plex-Discord Role Management API';

const onPlayBody = '{ "trigger": "playbackStarted", "user": "{user}", "username": "{username}" }';
const onStopBody = '{ "trigger": "playbackStopped", "user": "{user}", "username": "{username}" }';
const onCreatedBody = '{ "trigger": "recentlyAdded", "title": "{title}", "imdb_id": "{imdb_id}", "imdb_url": "{imdb_url}", "thetvdb_id": "{thetvdb_id}", "thetvdb_url": "{thetvdb_url}", "summary": "{summary}", "poster_url": "{poster_url}", "plex_url": "{plex_url}", <episode> "newOverride": "N/A", "contentType": "show", "show_name": "{show_name}", "messageContent":"A new episode of {show_name} has been added to plex.\\n{show_name} (S{season_num00}E{episode_num00}) - {episode_name}", "embedTitle": "{show_name} - {episode_name} (S{season_num} · E{episode_num})", "season_episode": "S{season_num00}E{episode_num00}" </episode> <movie> "contentType": "movie", "messageContent": "A new movie has been added to plex.\\n{title} ({year})", "year":"{year}", "release_date":"{release_date}", "embedTitle": "{title} ({year})"</movie> <show> "newOverride": "01-yes", "contentType": "show", "show_name": "{show_name}", "messageContent": "A new show has been added to plex.\\n{show_name}", "embedTitle": "{show_name}", "season_episode": "N/A" </show> <season> "newOverride": "{season_num00}-yes", "contentType": "show", "show_name": "{show_name}", "messageContent": "Season {season_num00} of {show_name} has been added to plex.\\n{show_name} Season {season_num00}", "embedTitle": "{show_name} · Season {season_num}", "season_episode": "N/A" </season><artist>"contentType": "music"</artist><album>"contentType": "music"</album><track>"contentType": "music"</track> }';

module.exports = async(port) => {
  class tautulliService {
    constructor() {
      this.baseURL = `${config.tautulli_ip}:${config.tautulli_port}/api/v2?apikey=${config.tautulli_api_key}&cmd=`;
      if (!this.baseURL.startsWith("http://") && !this.baseURL.startsWith("https://")) {
        // we need an http or https specified so we will asumme http
        this.baseURL = "http://" + this.baseURL;
      }
    }

    async updateTautulliHook() {
      try {
        const response = await fetch(baseURL + `get_notifiers`,  {
            method: 'GET'
        });
        const json = await response.json();
        if (json.response.result === "success") {
          //console.log("Connected to Tautulli...");
        }
        else {
          console.log("Couldn't fetch notifiers from Tautulli, check your config.json settings")
          return;
        }
        beforeChangeNotifiers = json.response;
        const notifiersMap = new Array();
    		var notificationUrl = `${config.node_hook_ip}:${config.node_hook_port}/hooks/tautulli/`;
        if (!notificationUrl.startsWith("http://") && !notificationUrl.startsWith("https://")) {
          // we need an http or https specified so we will asumme http
          notificationUrl = "http://" + notificationUrl;
        }

    		if (beforeChangeNotifiers && beforeChangeNotifiers.data) {
    			beforeChangeNotifiers.data.map((i) => { notifiersMap[i.friendly_name] = i; });
          const id = notifiersMap[apiName].id;
          this.getNotifierConfig(id).then((data) => {
            console.log('Updating WebHook...');
            this.setNotifierConfig(id, notificationUrl, false);
          });
        }
      } catch (error) {
        console.log(console.log(error));
      }
    }

    async getLibraries() {
      try {
        const response = await fetch(this.baseURL + `get_libraries`,  {
            method: 'GET'
        });
        const json = await response.json();
        return json.response;
      } catch (error) {
        console.log(console.log(error));
      }
    }

    async getNotifiers() {
      try {
        const response = await fetch(this.baseURL + `get_notifiers`,  {
            method: 'GET'
        });
        const json = await response.json();
        return json.response;
      } catch (error) {
        console.log(console.log(error));
      }
    }

    async addScriptNotifier(notificationUrl) {
			const before = await this.getNotifiers();

			const beforeMap = new Array(before.data.length);
			before.data.map((x) => { beforeMap[x.id] = x; });

      try {
        const response = await fetch(this.baseURL + `add_notifier_config&agent_id=25`,  {
            method: 'GET'
        });
        const json = await response.json();

        var res = json.response.data;
        const after = await this.getNotifiers();
        const afterArr = after.data;
        afterArr.forEach((item) => {
          if (!beforeMap[item.id]) this.setNotifierConfig(item.id, notificationUrl, true);
        });
      } catch (error) {
        console.log(console.log(error));
      }
    }

    async getNotifierConfig(notifierId) {
      try {
        const response = await fetch(this.baseURL + `get_notifier_config&notifier_id=${notifierId}`,  {
            method: 'GET'
        });
        const json = await response.json();
        return json.response.data;
      } catch (error) {
        console.log(console.log(error));
      }
	  }

    async setNotifierConfig(id, notificationUrl, isNew) {
      var custom_conditions = [];
      var custom_condition = {};
      var excludedLibraries = [];
      custom_condition.operator = 'does not contain';
      custom_condition.parameter = 'library_name';
      custom_condition.type = 'str';

      for (const libraryExclusionSettings of mainProgram.client.searchLibraryExclusionSettings.iterate()) {
				if (libraryExclusionSettings.excluded === "true") {
          excludedLibraries.push(libraryExclusionSettings.name);
				}
			}

      custom_condition.value = excludedLibraries;
      custom_conditions.push(custom_condition);

			const data = {
				notifier_id: id, agent_id: 25, webhook_hook: notificationUrl, webhook_method: 'POST',
				friendly_name: apiName, on_play: 1, on_stop: 1, on_pause: 0, on_resume: 0, on_watched: 0, on_buffer: 0, on_concurrent: 0, on_newdevice: 0, on_created: 1, on_intdown: 0,
				on_intup: 0, on_extdown: 0, on_extup: 0, on_pmsupdate: 0, on_plexpyupdate: 0, parameter: '', custom_conditions: JSON.stringify(custom_conditions),
				on_play_body: onPlayBody, on_stop_body: onStopBody, on_created_body: onCreatedBody
			};

      //custom_conditions: '%5B%7B%22operator%22%3A%22%22%2C%22parameter%22%3A%22%22%2C%22value%22%3A%22%22%7D%5D'

      try {
        const r = await axios({ method: 'POST', url: this.baseURL + `set_notifier_config`, data: jtfd(data) });
        if (isNew) console.log('Tautulli Webhook Created!');
        else console.log('Tautulli Webhook Updated!')
      } catch (error) {
        console.log(console.log(error));
      }
	  }
  }


  var baseURL = `${config.tautulli_ip}:${config.tautulli_port}/api/v2?apikey=${config.tautulli_api_key}&cmd=`;
  if (!baseURL.startsWith("http://") && !baseURL.startsWith("https://")) {
    // we need an http or https specified so we will asumme http
    baseURL = "http://" + baseURL;
  }
  service = new tautulliService();
  module.exports.tautulliService = service;

  try {
    const response = await fetch(baseURL + `get_notifiers`,  {
        method: 'GET'
    });
    const json = await response.json();
    if (json.response.result === "success") {
      console.log("Connected to Tautulli...");
    }
    else {
      console.log("Couldn't fetch notifiers from Tautulli, check your config.json settings")
      return;
    }
    beforeChangeNotifiers = json.response;
    const notifiersMap = new Array();
		var notificationUrl = `${config.node_hook_ip}:${config.node_hook_port}/hooks/tautulli/`;
    if (!notificationUrl.startsWith("http://") && !notificationUrl.startsWith("https://")) {
      // we need an http or https specified so we will asumme http
      notificationUrl = "http://" + notificationUrl;
    }

		if (beforeChangeNotifiers && beforeChangeNotifiers.data) {
			beforeChangeNotifiers.data.map((i) => { notifiersMap[i.friendly_name] = i; });

      if (!notifiersMap[apiName]) {
        console.log('Creating Tautulli Webhook...');
				service.addScriptNotifier(notificationUrl);
			}
      else {
				const id = notifiersMap[apiName].id;
				service.getNotifierConfig(id).then((data) => {
          var custom_conditions = [];
          var custom_condition = {};
          var excludedLibraries = [];
          custom_condition.operator = 'does not contain';
          custom_condition.type = 'str';
          custom_condition.parameter = 'library_name';

          for (const libraryExclusionSettings of mainProgram.client.searchLibraryExclusionSettings.iterate()) {
    				if (libraryExclusionSettings.excluded === "true") {
              excludedLibraries.push(libraryExclusionSettings.name);
    				}
    			}

          custom_condition.value = excludedLibraries;
          custom_conditions.push(custom_condition);

          if (JSON.stringify(data.custom_conditions) != JSON.stringify(custom_conditions)) {
            console.log('Updating WebHook...');
            //console.log(JSON.stringify(data.custom_conditions));
            //console.log(JSON.stringify(custom_conditions));
						service.setNotifierConfig(id, notificationUrl, false);
          }
					else if (data.config_options[0].value != notificationUrl) {
						console.log('Updating WebHook...');
						service.setNotifierConfig(id, notificationUrl, false);
					}
          else if (data.notify_text.on_created.body != onCreatedBody) {
						console.log('Updating WebHook...');
						service.setNotifierConfig(id, notificationUrl, false);
					}
          else if (data.notify_text.on_play.body != onPlayBody) {
						console.log('Updating WebHook...');
						service.setNotifierConfig(id, notificationUrl, false);
					}
          else if (data.notify_text.on_stop.body != onStopBody) {
						console.log('Updating WebHook...');
						service.setNotifierConfig(id, notificationUrl, false);
					}
          else {
            console.log('Tautulli Webhook is up-to-date!');
          }
				});
			}
    }
    else {
			console.log('Creating Tautulli Webhook...');
			service.addScriptNotifier(notificationUrl);
		}
  } catch (error) {
    console.log(console.log(error));
  }

  const app = express();

  // parse application/x-www-form-urlencoded
  app.use(bodyParser.urlencoded({ extended: false }))

  // parse application/json
  app.use(bodyParser.json())

  app.post('/hooks/tautulli', async (req, res) => {
    res.status(200).send('OK');
    mainProgram.processHook(req.body); // Process incoming webhooks
  });

  var server = app.listen(port, function() {
    console.log('Listening on port %d', server.address().port);
  });
}
