/*jshint esnext:true*/
/*exported HTTPResponse*/
'use strict';

window.HTTPResponse = (function() {

function HTTPResponse(socket) {
  this.socket = socket;
  this.headers = {};

  this.headers['Content-Type'] = 'text/html';
  this.headers['Connection']   = 'close';
}

Listenable(HTTPResponse.prototype);

HTTPResponse.prototype.constructor = HTTPResponse;

HTTPResponse.prototype.send = function(body, status) {
  this.socket.send(createResponse(body, status, this.headers));
  this.emit('send');
};

function createResponseHeader(status, headers) {
  status  = status  || 200;
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

return HTTPResponse;

})();
