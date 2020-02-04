const fetch = require('node-fetch');

class SonarrService {
  constructor(ip, port, api_key) {

    this.ip = ip;
    this.port = port;
    this.api_key = api_key;

    if (this.port === "" || this.port === null || this.port === undefined) {
      //assume webroot override is in effect
      this.baseURL = `${this.ip}`;
    }
    else {
      this.baseURL = `${this.ip}:${this.port}`;
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
  }

  async getSeries() {
    try {
      const response = await fetch(this.baseURL + `series?apikey=` + this.api_key,  {
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
      const response = await fetch(this.baseURL + `series/lookup?term=` + searchTerm + `&apikey=` + this.api_key,  {
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
module.exports = SonarrService;
