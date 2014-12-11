/*jshint esnext:true*/
/*exported HTTPResponse*/
'use strict';

window.HTTPResponse = (function() {

const CRLF = '\r\n';

function HTTPResponse(socket, timeout) {
  this.socket  = socket;
  this.timeout = timeout;

  this.headers = {};
  this.headers['Content-Type'] = 'text/html';
  this.headers['Connection']   = 'close';

  if (this.timeout) {
    this.timeoutHandler = setTimeout(() => {
      this.send(null, 500);
    }, this.timeout);
  }
}

Listenable(HTTPResponse.prototype);

HTTPResponse.prototype.constructor = HTTPResponse;

HTTPResponse.prototype.send = function(body, status) {
  var response = createResponse(body, status, this.headers);
  if (this.socket.binaryType === 'arraybuffer') {
    response = BinaryUtils.stringToArrayBuffer(response);
  }

  this.socket.send(response);

  clearTimeout(this.timeoutHandler);
  this.emit('complete');
};

HTTPResponse.prototype.sendFile = function(path, status) {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', path, true);
  xhr.responseType = 'arraybuffer';
  xhr.onload = () => {
    var body = BinaryUtils.arrayBufferToString(xhr.response);
    this.send(body, status);
  };

  xhr.send(null);
};

function createResponseHeader(status, headers) {
  var header = HTTPStatus.getStatusLine(status);

  for (var name in headers) {
    header += name + ': ' + headers[name] + CRLF;
  }

  return header;
}

function createResponse(body, status, headers) {
  body    = body    || '';
  status  = status  || 200;
  headers = headers || {};

  headers['Content-Length'] = body.length;

  return createResponseHeader(status, headers) + CRLF + body;
}

return HTTPResponse;

})();
