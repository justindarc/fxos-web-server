/*jshint esnext:true*/
/*exported HTTPRequest*/
'use strict';

module.exports = window.HTTPRequest = (function() {

var EventTarget = require('./event-target');
var BinaryUtils = require('./binary-utils');

const CRLF = '\r\n';

function HTTPRequest(socket) {
  var parts = [];
  var receivedLength = 0;

  var checkRequestComplete = () => {
    var contentLength = parseInt(this.headers['Content-Length'], 10);
    if (isNaN(contentLength)) {
      this.complete = true;
      this.dispatchEvent('complete', this);
      return;
    }

    if (receivedLength < contentLength) {
      return;
    }

    BinaryUtils.mergeArrayBuffers(parts, (data) => {
      this.body = parseBody(this.headers['Content-Type'], data);
      this.complete = true;
      this.dispatchEvent('complete', this);
    });

    socket.ondata = null;
  };

  socket.ondata = (event) => {
    var data = event.data;

    if (parts.length > 0) {
      parts.push(data);
      receivedLength += data.byteLength;
      checkRequestComplete();
      return;
    }

    var firstPart = parseHeader(this, data);
    if (this.invalid) {
      this.dispatchEvent('error', this);

      socket.close();
      socket.ondata = null;
      return;
    }

    if (firstPart) {
      parts.push(firstPart);
      receivedLength += firstPart.byteLength;
    }

    checkRequestComplete();
  };
}

HTTPRequest.prototype = new EventTarget();

HTTPRequest.prototype.constructor = HTTPRequest;

function parseHeader(request, data) {
  if (!data) {
    request.invalid = true;
    return null;
  }

  data = BinaryUtils.arrayBufferToString(data);

  var requestParts = data.split(CRLF + CRLF);

  var header = requestParts.shift();
  var body   = requestParts.join(CRLF + CRLF);

  var headerLines = header.split(CRLF);
  var requestLine = headerLines.shift().split(' ');
  
  var method  = requestLine[0];
  var uri     = requestLine[1];
  var version = requestLine[2];

  if (version !== HTTPServer.HTTP_VERSION) {
    request.invalid = true;
    return null;
  }

  var uriParts = uri.split('?');
  
  var path   = uriParts.shift();
  var params = parseURLEncodedString(uriParts.join('?'));

  var headers = {};
  headerLines.forEach((headerLine) => {
    var parts = headerLine.split(': ');
    if (parts.length !== 2) {
      return;
    }

    var name  = parts[0];
    var value = parts[1];

    headers[name] = value;
  });

  request.method  = method;
  request.path    = path;
  request.params  = params;
  request.headers = headers;

  if (headers['Content-Length']) {
    // request.body = parseBody(headers['Content-Type'], body);
    return BinaryUtils.stringToArrayBuffer(body);
  }

  return null;
}

function setOrAppendValue(object, name, value) {
  var existingValue = object[name];
  if (existingValue === undefined) {
    object[name] = value;
  } else {
    if (Array.isArray(existingValue)) {
      existingValue.push(value);
    } else {
      object[name] = [existingValue, value];
    }
  }
}

function parseURLEncodedString(string) {
  var values = {};

  string.split('&').forEach((pair) => {
    if (!pair) {
      return;
    }

    var parts = decodeURIComponent(pair).split('=');

    var name  = parts.shift();
    var value = parts.join('=');

    setOrAppendValue(values, name, value);
  });

  return values;
}

function parseMultipartFormDataString(string, boundary) {
  var values = {};

  string.split('--' + boundary).forEach((data) => {
    data = data.replace(/^\r\n/, '').replace(/\r\n$/, '');

    if (!data || data === '--') {
      return;
    }

    var parts = data.split(CRLF + CRLF);
    
    var header = parts.shift();
    var value  = parts.join(CRLF + CRLF);

    var headerParams = header.split(';');
    var headerParts = headerParams.shift().split(': ');

    var headerName  = headerParts[0];
    var headerValue = headerParts[1];

    if (headerName  !== 'Content-Disposition' ||
        headerValue !== 'form-data') {
      return;
    }

    var name;

    headerParams.forEach((param) => {
      var paramParts = param.trim().split('=');

      var paramName  = paramParts[0];
      var paramValue = paramParts[1];

      if (paramName === 'name') {
        name = paramValue.replace(/\"(.*?)\"/, '$1') || paramValue;
      }
    });

    if (name) {
      setOrAppendValue(values, name, value);
    }
  });

  return values;
}

function parseBody(contentType, data) {
  contentType = contentType || 'text/plain';

  var contentTypeParams = contentType.replace(/\s/g, '').split(';');
  var mimeType = contentTypeParams.shift();

  var body = BinaryUtils.arrayBufferToString(data);

  var result;

  try {
    switch (mimeType) {
      case 'application/x-www-form-urlencoded':
        result = parseURLEncodedString(body);
        break;
      case 'multipart/form-data':
        contentTypeParams.forEach((contentTypeParam) => {
          var parts = contentTypeParam.split('=');

          var name  = parts[0];
          var value = parts[1];

          if (name === 'boundary') {
            result = parseMultipartFormDataString(body, value);
          }
        });
        break;
      case 'application/json':
        result = JSON.parse(body);
        break;
      case 'application/xml':
        result = new DOMParser().parseFromString(body, 'text/xml');
        break;
      default:
        break;
    }
  } catch (exception) {
    console.log('Unable to parse HTTP request body with Content-Type: ' + contentType);
  }

  return result || body;
}

return HTTPRequest;

})();
