/*jshint esnext:true*/
/*exported HTTPResponse*/
'use strict';

module.exports = window.HTTPResponse = (function() {

var Listenable  = require('./listenable');
var BinaryUtils = require('./binary-utils');
var HTTPStatus  = require('./http-status');

const CRLF = '\r\n';
const BUFFER_SIZE = 64 * 1024;

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
    var offset = 0;
    var remaining = response.byteLength;

    var sendNextPart = () => {
      var length = Math.min(remaining, BUFFER_SIZE);

      var bufferFull = this.socket.send(response, offset, length);

      offset += length;
      remaining -= length;

      if (remaining > 0) {
        if (!bufferFull) {
          sendNextPart();
        }
      }
      
      else {
        clearTimeout(this.timeoutHandler);

        this.socket.close();
        this.emit('complete');
      }
    };

    this.socket.ondrain = sendNextPart;

    sendNextPart();
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
