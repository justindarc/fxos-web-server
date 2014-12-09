/*jshint esnext:true*/
/*exported HTTPServer*/
'use strict';

window.HTTPServer = (function() {

const DEFAULT_PORT = 8080;
const DEFAULT_TIMEOUT = 20000;

function HTTPServer(port, options) {
  this.port = port || DEFAULT_PORT;

  options = options || {};
  for (var option in options) {
    this[option] = options[option];
  }

  this.running = false;
}

Listenable(HTTPServer.prototype);

HTTPServer.prototype.constructor = HTTPServer;

HTTPServer.prototype.timeout = DEFAULT_TIMEOUT;

HTTPServer.prototype.start = function() {
  console.log('Starting HTTP server on port ' + this.port);

  var socket = navigator.mozTCPSocket.listen(this.port);

  socket.onconnect = (connectEvent) => {
    connectEvent.ondata = (dataEvent) => {
      var request = parseRequestData(dataEvent.data);
      var response = new HTTPResponse(connectEvent);

      var responseTimeout = setTimeout(() => {
        response.send(null, 500);
      }, this.timeout);

      response.addEventListener('send', () => {
        clearTimeout(responseTimeout);
      });

      this.emit('request', {
        request: request,
        response: response
      });
    };
  };

  this.socket = socket;
  this.running = true;
};

HTTPServer.prototype.stop = function() {
  console.log('Shutting down HTTP server on port ' + this.port);

  this.socket.close();

  this.running = false;
};

function parseRequestData(requestData) {
  var lines = (requestData || '').split('\r\n');
  var start = lines.shift().split(' ');
  
  var request = {
    method: start[0],
    path: start[1]
  };

  var headers = {};
  lines.forEach((line) => {
    var parts = line.split(': ');
    if (parts.length !== 2) {
      return;
    }

    var name  = parts[0];
    var value = parts[1];

    headers[name] = value;
  });

  request.headers = headers;

  return request;
}

return HTTPServer;

})();
