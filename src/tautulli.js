const express = require('express');
const bodyParser = require('body-parser')

module.exports = (port) => {
  const app = express();

  // parse application/x-www-form-urlencoded
  app.use(bodyParser.urlencoded({ extended: false }))

  // parse application/json
  app.use(bodyParser.json())

  app.post('/hook/tautulli', async (req, res) => {
    console.log(req.body);

    res.status(200).send('OK');
    //console.log(res);
    /*
    var events = req.body;
    events.forEach(function (event) {
      // Here, you now have each event and can process them how you like
  	  processEvent(event);
    });
    */
  });

  var server = app.listen(port, function() {
    console.log('Listening on port %d', server.address().port);
  });
}
