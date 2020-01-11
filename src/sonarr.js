const fetch = require('node-fetch');
const mainProgram = require("../index.js");
const config = require("../config/config.json");

module.exports = async() => {
  class sonarrService {
    constructor() {
      var url = config.sonarr_web_address;
      if (!url) {
        console.log("No sonarr settings detected in `./config/config.json`!");
        return message.channel.send("No sonarr settings detected in `./config/config.json`!");
      }
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        // we need an http or https specified so we will asumme http
        console.log("Please adjust your config.sonarr_web_address to include http:// or https://. Since it was not included, I am assuming it is http://");
        url = "http://" + url;
      }
      if (!url.endsWith('/')) {
        url = url + '/';
      }
      this.baseURL = url;
      this.sonarr_api_key = config.sonarr_api_key;
      //url = url + "api/series?apikey=" + config.sonarr_api_key;
    }

    async getSeries() {
      try {
        const response = await fetch(this.baseURL + `api/series?apikey=` + this.sonarr_api_key,  {
            method: 'GET'
        });
        const json = await response.json();
        return json;
      } catch (error) {
        console.log(console.log(error));
        console.log("Couldn't connect to Sonarr, check your settings.");
        message.channel.send("Couldn't connect to Sonarr, check your settings.");
      }
    }
  }

  sonarrService = new sonarrService();
  module.exports.sonarrService = sonarrService;
}
