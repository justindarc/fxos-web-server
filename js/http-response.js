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
  var response = createResponse(body, status, this.headers);
  if (this.socket.binaryType === 'arraybuffer') {
    response = stringToArrayBuffer(response);
  }

  this.socket.send(response);
  this.emit('send');
};

HTTPResponse.prototype.sendFile = function(path, status) {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', path, true);
  xhr.responseType = 'arraybuffer';
  xhr.onload = () => {
    var body = arrayBufferToString(xhr.response);
    this.send(body, status);
  };

  xhr.send(null);
};

function createResponseHeader(status, headers) {
  var statusName = HTTPStatus[status] || '';
  var header = 'HTTP/1.1 ' + status + ' ' + statusName + '\r\n';

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

function stringToArrayBuffer(string) {
  var length = (string || '').length;
  var arrayBuffer = new ArrayBuffer(length);
  var uint8Array = new Uint8Array(arrayBuffer);
  for (var i = 0; i < length; i++) {
    uint8Array[i] = string.charCodeAt(i);
  }

  return arrayBuffer;
}

function arrayBufferToString(arrayBuffer) {
  return String.fromCharCode.apply(null, new Uint8Array(arrayBuffer));
}

return HTTPResponse;

})();
