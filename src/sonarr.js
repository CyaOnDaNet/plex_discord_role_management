const fetch = require('node-fetch');
const mainProgram = require("../index.js");

module.exports = async(config) => {
  class sonarrService {
    constructor() {
      var url = `${config.sonarr_ip}:${config.sonarr_port}/`;
      this.baseURL = url;
      this.sonarr_api_key = config.sonarr_api_key;
    }

    async getSeries() {
      try {
        const response = await fetch(this.baseURL + `api/series?apikey=` + this.sonarr_api_key,  {
            method: 'GET'
        });
        const json = await response.json();
        return json;
      } catch (error) {
        console.log(error);
        return "error";
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
        console.log(error);
        return "error";
      }
    }
  }

  sonarrService = new sonarrService();
  module.exports.sonarrService = sonarrService;
}
