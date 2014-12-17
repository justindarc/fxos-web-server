!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.HTTPServer=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*jshint esnext:true*/
/*exported BinaryUtils*/
'use strict';

module.exports = window.BinaryUtils = (function() {

var BinaryUtils = {
  stringToArrayBuffer: function(string) {
    var length = (string || '').length;
    var arrayBuffer = new ArrayBuffer(length);
    var uint8Array = new Uint8Array(arrayBuffer);
    for (var i = 0; i < length; i++) {
      uint8Array[i] = string.charCodeAt(i);
    }

    return arrayBuffer;
  },

  arrayBufferToString: function(arrayBuffer) {
    return String.fromCharCode.apply(null, new Uint8Array(arrayBuffer));
  }
};

return BinaryUtils;

})();

},{}],2:[function(require,module,exports){
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

},{"./binary-utils":1,"./listenable":7}],3:[function(require,module,exports){
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
  var response = createResponse(body, status, this.headers);
  if (this.socket.binaryType === 'arraybuffer') {
    response = BinaryUtils.stringToArrayBuffer(response);
  }

  this.socket.send(response);

  clearTimeout(this.timeoutHandler);
  this.emit('complete');
};

HTTPResponse.prototype.sendFile = function(fileOrPath, status) {
  if (fileOrPath instanceof File) {
    var fileReader = new FileReader();
    fileReader.onload = () => {
      var body = BinaryUtils.arrayBufferToString(fileReader.result);
      this.send(body, status);
    };

    fileReader.readAsArrayBuffer(fileOrPath);
    return;
  }

  var xhr = new XMLHttpRequest();
  xhr.open('GET', fileOrPath, true);
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

},{"./binary-utils":1,"./http-status":5,"./listenable":7}],4:[function(require,module,exports){
/*jshint esnext:true*/
/*exported HTTPServer*/
'use strict';

module.exports = window.HTTPServer = (function() {

var Listenable   = require('./listenable');
var HTTPRequest  = require('./http-request');
var HTTPResponse = require('./http-response');
var IPUtils      = require('./ip-utils');

const DEFAULT_PORT = 8080;
const DEFAULT_TIMEOUT = 20000;

const CRLF = '\r\n';

function HTTPServer(port, options) {
  this.port = port || DEFAULT_PORT;

  options = options || {};
  for (var option in options) {
    this[option] = options[option];
  }

  this.running = false;
}

HTTPServer.HTTP_VERSION = 'HTTP/1.1';

Listenable(HTTPServer.prototype);

HTTPServer.prototype.constructor = HTTPServer;

HTTPServer.prototype.timeout = DEFAULT_TIMEOUT;

HTTPServer.prototype.start = function() {
  if (this.running) {
    return;
  }

  console.log('Starting HTTP server on port ' + this.port);

  var socket = navigator.mozTCPSocket.listen(this.port, {
    binaryType: 'string' // 'arraybuffer'
  });

  socket.onconnect = (connectEvent) => {
    connectEvent.ondata = (dataEvent) => {
      var request = new HTTPRequest(dataEvent.data);
      if (request.invalid) {
        connectEvent.close();
        return;
      }

      var response = new HTTPResponse(connectEvent, this.timeout);

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
  if (!this.running) {
    return;
  }

  console.log('Shutting down HTTP server on port ' + this.port);

  this.socket.close();

  this.running = false;
};

return HTTPServer;

})();

},{"./http-request":2,"./http-response":3,"./ip-utils":6,"./listenable":7}],5:[function(require,module,exports){
/*jshint esnext:true*/
/*exported HTTPStatus*/
'use strict';

module.exports = window.HTTPStatus = (function() {

const CRLF = '\r\n';

var HTTPStatus = {};

HTTPStatus.STATUS_CODES = {
  100: 'Continue',
  101: 'Switching Protocols',
  102: 'Processing',
  200: 'OK',
  201: 'Created',
  202: 'Accepted',
  203: 'Non Authoritative Information',
  204: 'No Content',
  205: 'Reset Content',
  206: 'Partial Content',
  207: 'Multi-Status',
  300: 'Mutliple Choices',
  301: 'Moved Permanently',
  302: 'Moved Temporarily',
  303: 'See Other',
  304: 'Not Modified',
  305: 'Use Proxy',
  307: 'Temporary Redirect',
  400: 'Bad Request',
  401: 'Unauthorized',
  402: 'Payment Required',
  403: 'Forbidden',
  404: 'Not Found',
  405: 'Method Not Allowed',
  406: 'Not Acceptable',
  407: 'Proxy Authentication Required',
  408: 'Request Timeout',
  409: 'Conflict',
  410: 'Gone',
  411: 'Length Required',
  412: 'Precondition Failed',
  413: 'Request Entity Too Large',
  414: 'Request-URI Too Long',
  415: 'Unsupported Media Type',
  416: 'Requested Range Not Satisfiable',
  417: 'Expectation Failed',
  419: 'Insufficient Space on Resource',
  420: 'Method Failure',
  422: 'Unprocessable Entity',
  423: 'Locked',
  424: 'Failed Dependency',
  500: 'Server Error',
  501: 'Not Implemented',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
  504: 'Gateway Timeout',
  505: 'HTTP Version Not Supported',
  507: 'Insufficient Storage'
};

HTTPStatus.getStatusLine = function(status) {
  var reason = HTTPStatus.STATUS_CODES[status] || 'Unknown';

  return [HTTPServer.HTTP_VERSION, status, reason].join(' ') + CRLF;
};

return HTTPStatus;

})();

},{}],6:[function(require,module,exports){
/*jshint esnext:true*/
/*exported IPUtils*/
'use strict';

module.exports = window.IPUtils = (function() {

const CRLF = '\r\n';

var IPUtils = {
  getAddresses: function(callback) {
    if (typeof callback !== 'function') {
      console.warn('No callback provided');
      return;
    }

    var addresses = {
      '0.0.0.0': true
    };

    var rtc = new mozRTCPeerConnection({ iceServers: [] });
    rtc.createDataChannel('', { reliable: false });

    rtc.onicecandidate = function(evt) {
      if (evt.candidate) {
        parseSDP('a=' + evt.candidate.candidate);
      }
    };

    rtc.createOffer((description) => {
      parseSDP(description.sdp);
      rtc.setLocalDescription(description, noop, noop);
    }, (error) => {
      console.warn('Unable to create offer', error);
    });

    function addAddress(address) {
      if (addresses[address]) {
        return;
      }

      addresses[address] = true;
      callback(address);
    }

    function parseSDP(sdp) {
      sdp.split(CRLF).forEach((line) => {
        var parts = line.split(' ');

        if (line.indexOf('a=candidate') !== -1) {
          if (parts[7] === 'host') {
            addAddress(parts[4]);
          }
        }

        else if (line.indexOf('c=') !== -1) {
          addAddress(parts[2]);
        }
      });
    }
  }
};

function noop() {}

return IPUtils;

})();

},{}],7:[function(require,module,exports){
/*jshint esnext:true*/
/*exported Listenable*/
'use strict';

module.exports = window.Listenable = (function() {

function Listenable(object) {
  object.emit = function(name, data) {
    var events    = this._events || {};
    var listeners = events[name] || [];
    listeners.forEach((listener) => {
      listener.call(this, data);
    });
  };

  object.addEventListener = function(name, listener) {
    var events    = this._events = this._events || {};
    var listeners = events[name] = events[name] || [];
    if (listeners.find(fn => fn === listener)) {
      return;
    }

    listeners.push(listener);
  };

  object.removeEventListener = function(name, listener) {
    var events    = this._events || {};
    var listeners = events[name] || [];
    for (var i = listeners.length - 1; i >= 0; i--) {
      if (listeners[i] === listener) {
        listeners.splice(i, 1);
        return;
      }
    }
  };
}

return Listenable;

})();

},{}]},{},[4])(4)
});