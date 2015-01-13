!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.P2PHelper=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*jshint esnext:true*/
/*exported P2PHelper*/
'use strict';

module.exports = window.P2PHelper = (function() {

var wifiManager = navigator.mozWifiManager;
var wifiP2pManager = navigator.mozWifiP2pManager;

var scanInterval = null;
var groupOwner = null;

var P2PHelper = {
  localAddress: wifiManager.macAddress,
  remoteAddress: null,

  wpsMethod: 'pbc',
  goIntent: 0,

  connect: function(remoteAddress) {
    if (P2PHelper.remoteAddress) {
      return;
    }

    console.log('Attempting to connect to address ' + remoteAddress + ' ' +
                'with WPS method "' + P2PHelper.wpsMethod + '" ' +
                'and intent "' + P2PHelper.goIntent + '"');

    wifiP2pManager.connect(remoteAddress, P2PHelper.wpsMethod, P2PHelper.goIntent);
    P2PHelper.remoteAddress = remoteAddress;
  },

  disconnect: function() {
    if (!P2PHelper.remoteAddress) {
      return;
    }

    wifiP2pManager.disconnect(P2PHelper.remoteAddress);
    P2PHelper.remoteAddress = null;
  },

  startScan: function(callback) {
    var request = wifiP2pManager.setScanEnabled(true);
    request.onsuccess = request.onerror = callback;

    scanInterval = setInterval(P2PHelper.restartScan, 5000);
  },

  stopScan: function(callback) {
    clearInterval(scanInterval);

    var request = wifiP2pManager.setScanEnabled(false);
    request.onsuccess = request.onerror = callback;
  },

  restartScan: function() {
    P2PHelper.stopScan(function() {
      P2PHelper.startScan();
    });
  },

  setDisplayName: function(displayName) {
    wifiP2pManager.setDeviceName(displayName);
  },

  dispatchEvent: function(name, data) {
    var events    = this._events || {};
    var listeners = events[name] || [];
    listeners.forEach((listener) => {
      listener.call(this, data);
    });
  },

  addEventListener: function(name, listener) {
    var events    = this._events = this._events || {};
    var listeners = events[name] = events[name] || [];
    if (listeners.find(fn => fn === listener)) {
      return;
    }

    listeners.push(listener);
  },

  removeEventListener: function(name, listener) {
    var events    = this._events || {};
    var listeners = events[name] || [];
    for (var i = listeners.length - 1; i >= 0; i--) {
      if (listeners[i] === listener) {
        listeners.splice(i, 1);
        return;
      }
    }
  }
};

wifiP2pManager.addEventListener('statuschange', (evt) => {
  console.log('wifiP2pManager::statuschange', evt);

  P2PHelper.dispatchEvent('statuschange');

  if (groupOwner && !wifiP2pManager.groupOwner) {
    groupOwner = null;
    P2PHelper.dispatchEvent('disconnected');
    return;
  }

  groupOwner = wifiP2pManager.groupOwner;

  if (groupOwner) {
    P2PHelper.dispatchEvent('connected', {
      groupOwner: groupOwner
    });
  }
});

wifiP2pManager.addEventListener('peerinfoupdate', (evt) => {
  console.log('wifiP2pManager::peerinfoupdate', evt);

  var request = wifiP2pManager.getPeerList();
  request.onsuccess = function() {
    P2PHelper.dispatchEvent('peerlistchange', {
      peerList: request.result
    });
  };
  request.onerror = function() {
    console.warn('Unable to get peer list', request.error);
  };
});

navigator.mozSetMessageHandler('wifip2p-pairing-request', (evt) => {
  console.log('wifip2p-pairing-request', evt);

  var accepted = true;
  var pin = ''; // optional

  P2PHelper.dispatchEvent('pairingrequest');

  wifiP2pManager.setPairingConfirmation(accepted, pin);
});

return P2PHelper;

})();

},{}]},{},[1])(1)
});