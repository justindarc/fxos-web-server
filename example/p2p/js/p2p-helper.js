window.P2PHelper = (function() {

  var wifiManager = navigator.mozWifiManager;
  var wifiP2pManager = navigator.mozWifiP2pManager;

  if (!wifiManager || !wifiP2pManager) {
    return null;
  }

  wifiP2pManager.addEventListener('statuschange', function(evt) {
    console.log('wifiP2pManager::statuschange', evt);

    var groupOwner = wifiP2pManager.groupOwner;
    if (groupOwner) {
      P2PHelper.emit('connected', {
        groupOwner: groupOwner
      });

      return;
    }

    P2PHelper.emit('disconnected');
  });

  wifiP2pManager.addEventListener('peerinfoupdate', function(evt) {
    console.log('wifiP2pManager::peerinfoupdate', evt);

    var request = wifiP2pManager.getPeerList();
    request.onsuccess = function() {
      P2PHelper.emit('peerlistchange', {
        peerList: request.result
      });
    };
    request.onerror = function() {
      console.warn('Unable to get peer list', request.error);
    };
  });

  navigator.mozSetMessageHandler('wifip2p-pairing-request', function(evt) {
    console.log('wifip2p-pairing-request', evt);

    var accepted = true;
    var pin = ''; // optional
    
    P2PHelper.emit('pairingrequest');

    wifiP2pManager.setPairingConfirmation(accepted, pin);
  });

  var P2PHelper = {
    localAddress: wifiManager.macAddress,
    remoteAddress: null,

    wpsMethod: 'pbc',
    goIntent: 1,

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
    },

    stopScan: function(callback) {
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
    }
  };

  Listenable(P2PHelper);

  return P2PHelper;

})();
