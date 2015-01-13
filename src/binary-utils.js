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
    var results = [];
    var uint8Array = new Uint8Array(arrayBuffer);

    for (var i = 0, length = uint8Array.length; i < length; i += 200000) {
      results.push(String.fromCharCode.apply(null, uint8Array.subarray(i, i + 200000)));
    }

    return results.join('');
  },

  blobToArrayBuffer: function(blob, callback) {
    var fileReader = new FileReader();
    fileReader.onload = function() {
      if (typeof callback === 'function') {
        callback(fileReader.result);
      }
    };
    fileReader.readAsArrayBuffer(blob);

    return fileReader.result;
  },

  mergeArrayBuffers: function(arrayBuffers, callback) {
    return BinaryUtils.blobToArrayBuffer(new Blob(arrayBuffers), callback);
  }
};

return BinaryUtils;

})();
