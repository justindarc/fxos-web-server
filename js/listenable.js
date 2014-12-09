/*jshint esnext:true*/
/*exported Listenable*/
'use strict';

window.Listenable = (function() {

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
