const fetch = require('node-fetch');
const mainProgram = require("../index.js");

module.exports = async(config) => {
  class sonarrService {
    constructor() {

      if (config.sonarr_port === "" || config.sonarr_port === null || config.sonarr_port === undefined) {
        //assume webroot override is in effect
        this.baseURL = `${config.sonarr_ip}`;
      }
      else {
        this.baseURL = `${config.sonarr_ip}:${config.sonarr_port}`;
      }

      var lastChar = this.baseURL[this.baseURL.length -1];
      if (lastChar == "/") {
        this.baseURL = `${this.baseURL}api/`;
      }
      else {
        this.baseURL = `${this.baseURL}/api/`;
      }

      if (!this.baseURL.startsWith("http://") && !this.baseURL.startsWith("https://")) {
        // we need an http or https specified so we will asumme http
        this.baseURL = "http://" + this.baseURL;
      }
      this.sonarr_api_key = config.sonarr_api_key;
    }

    async getSeries() {
      try {
        const response = await fetch(this.baseURL + `series?apikey=` + this.sonarr_api_key,  {
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
        const response = await fetch(this.baseURL + `series/lookup?term=` + searchTerm + `&apikey=` + this.sonarr_api_key,  {
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
