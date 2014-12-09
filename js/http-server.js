window.HTTPServer = (function() {

function parseRequestData(requestData) {
  var lines = (requestData || '').split('\r\n');
  var start = lines.shift().split(' ');
  
  var request = {
    method: start[0],
    path: start[1]
  };

  var headers = {};
  lines.forEach(function(line) {
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

function createResponseHeader(status, headers) {
  status  = status || 200;
  headers = headers || {};

  var header = 'HTTP/1.1 ' + status + ' OK\r\n';

  headers['Content-Type'] = headers['Content-Type'] || 'text/html';
  headers['Connection']   = headers['Connection']   || 'close';

  for (var name in headers) {
    header += name + ': ' + headers[name] + '\r\n';
  }

  return header;
}

function createResponse(body, status, headers) {
  body    = body    || '';
  status  = status  || 200;
  headers = headers || {};

  headers['Content-Length'] = body.length;

  return createResponseHeader(status, headers) + '\r\n' + body;
}

function HTTPServer(port) {
  this.port = port;
  this.running = false;
}

HTTPServer.prototype.constructor = HTTPServer;

HTTPServer.prototype.start = function() {
  console.log('Starting HTTP server on port ' + this.port);

  this.socket = navigator.mozTCPSocket.listen(this.port);
  console.log(this.socket);
  this.socket.onconnect = function(connectEvent) {
    connectEvent.ondata = function(dataEvent) {
      var request = parseRequestData(dataEvent.data);
      console.log(request);

      var body =
`<!DOCTYPE html>
<html>
<head>
  <title>Firefox OS Web Server</title>
</head>
<body>
  <h1>Hello World!</h1>
  <h3>If you can read this, the Firefox OS Web Server is operational!</h3>
  <p>The path you requested is: ${request.path}</p>
</body>
</html>`

      var response = createResponse(body);
      connectEvent.send(response);
    };
  };

  this.running = true;
};

HTTPServer.prototype.stop = function() {
  console.log('Shutting down HTTP server on port ' + this.port);

  this.socket.close();

  this.running = false;
};

return HTTPServer;

})();
