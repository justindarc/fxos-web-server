/*jshint esnext:true*/
/*exported BinaryUtils*/
'use strict';

window.BinaryUtils = (function() {

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
