/*jshint esnext:true*/
/*exported HTTPRequest*/
'use strict';

module.exports = window.HTTPRequest = (function() {

var Listenable  = require('./listenable');
var BinaryUtils = require('./binary-utils');

const CRLF = '\r\n';

function HTTPRequest(requestData) {
  var parsed = parseRequestData(requestData);
  if (!parsed) {
    this.invalid = true;
    return;
  }

  for (var property in parsed) {
    this[property] = parsed[property];
  }
}

Listenable(HTTPRequest.prototype);

HTTPRequest.prototype.constructor = HTTPRequest;

function parseRequestData(requestData) {
  if (requestData instanceof ArrayBuffer) {
    requestData = BinaryUtils.arrayBufferToString(requestData);
  }

  if (!requestData) {
    return null;
  }

  var requestParts = requestData.split(CRLF + CRLF);

  var header = requestParts.shift();
  var body   = requestParts.join(CRLF + CRLF);

  var headerLines = header.split(CRLF);
  var requestLine = headerLines.shift().split(' ');
  
  var method  = requestLine[0];
  var uri     = requestLine[1];
  var version = requestLine[2];

  if (version !== HTTPServer.HTTP_VERSION) {
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

  var request = {
    method:  method,
    path:    path,
    params:  params,
    headers: headers
  };

  if (headers['Content-Length']) {
    request.body = parseBody(headers['Content-Type'], body);
  }

  return request;
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

function parseBody(contentType, body) {
  contentType = contentType || 'text/plain';

  var contentTypeParams = contentType.replace(/\s/g, '').split(';');
  var mimeType = contentTypeParams.shift();

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
