var http = require('http');
var server = new http.Server();
var test_data = require('./data');

var BASE_RESPONSE_RATE = 200;
var MAX_RESPONSE_DEVIATION = 100;

var count = 0;
server.on('request', function(req, res) {
  if (count > test_data.length - 1) {
    count = 0;
  }
  var content = JSON.stringify(test_data[count]);
  count++;
  res.writeHead(200, {
    'Content-Type': 'application/json',
    'Content-Length': content.length
  });
  setTimeout(function () {
    res.end(content);
  }, BASE_RESPONSE_RATE + (Math.random() * MAX_RESPONSE_DEVIATION));
});

var port = process.env.PORT || 8080;
server.listen(port);

console.log("mock-api server listening on port " + port);

module.exports = server;
