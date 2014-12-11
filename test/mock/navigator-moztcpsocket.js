/*jshint esnext:true*/
/*exported MockMozTCPSocket*/
'use strict';

window.MockMozTCPSocket = (function() {

var MockMozTCPSocket = {
  listen: sinon.spy()
};

return MockMozTCPSocket;

})();
