const fetch = require('node-fetch');
const mainProgram = require("../index.js");

module.exports = async(config) => {
  class sonarrService {
    constructor() {
      var url = `${config.sonarr_ip}:${config.sonarr_port}/`;
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

    async lookUpSeries(searchTerm) {
      try {
        const response = await fetch(this.baseURL + `api/series/lookup?term=` + searchTerm + `&apikey=` + this.sonarr_api_key,  {
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
