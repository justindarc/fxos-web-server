/*jshint esnext:true*/
/*exported HTTPResponse*/
'use strict';

module.exports = window.HTTPResponse = (function() {

var Listenable  = require('./listenable');
var BinaryUtils = require('./binary-utils');
var HTTPStatus  = require('./http-status');

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
  return createResponse(body, status, this.headers, (response) => {
    this.socket.send(response, 0, response.byteLength);
    this.socket.close();

    clearTimeout(this.timeoutHandler);
    this.emit('complete');
  });
};

HTTPResponse.prototype.sendFile = function(fileOrPath, status) {
  if (fileOrPath instanceof File) {
    BinaryUtils.blobToArrayBuffer(fileOrPath, (arrayBuffer) => {
      this.send(arrayBuffer, status);
    });

    return;
  }

  var xhr = new XMLHttpRequest();
  xhr.open('GET', fileOrPath, true);
  xhr.responseType = 'arraybuffer';
  xhr.onload = () => {
    this.send(xhr.response, status);
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

function createResponse(body, status, headers, callback) {
  body    = body    || '';
  status  = status  || 200;
  headers = headers || {};

  headers['Content-Length'] = body.length || body.byteLength;

  var response = new Blob([
    createResponseHeader(status, headers),
    CRLF,
    body
  ]);

  return BinaryUtils.blobToArrayBuffer(response, callback);
}

return HTTPResponse;

})();
