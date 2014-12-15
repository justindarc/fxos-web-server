var httpServer = new HTTPServer(8080);

httpServer.addEventListener('request', function(evt) {
  var request  = evt.request;
  var response = evt.response;
  
  console.log(request);

  var body =
`<!DOCTYPE html>
<html>
<head>
  <title>Firefox OS Web Server</title>
</head>
<body>
  <h1>Hello World!</h1>
  <h3>If you can read this, the Firefox OS Web Server is operational!</h3>
  <p>The path you requested is: ${request.path}</p>
</body>
</html>`;

  response.send(body);
});

window.addEventListener('load', function() {
  var wifiManager = navigator.mozWifiManager;
  var wifiP2pManager = navigator.mozWifiP2pManager;
  if (!wifiManager || !wifiP2pManager) {
    alert('WiFi Direct is not available on this device');
    window.close();
    return;
  }

  var peers = document.getElementById('peers');

  window.updatePeers = function updatePeers() {
    var request = wifiP2pManager.getPeerList();
    request.onsuccess = function() {
      var peerList = request.result;
      console.log('peerList', peerList);
      peers.innerHTML = '';

      peerList.forEach(function(peer) {
        var li = document.createElement('li');
        li.dataset.address = peer.address;
        li.dataset.status = peer.connectionStatus;

        var a = document.createElement('a');
        a.href = '#' + peer.address;
        a.textContent = peer.name;

        li.appendChild(a);
        peers.appendChild(li);
      });
    };
    request.onerror = function() {
      console.warn('Unable to get peer list', request.error);
    };
  }

  window.getGroupOwnerNetwork = function getGroupOwnerNetwork(success, error) {
    var groupOwner = wifiP2pManager.groupOwner;
    console.log(groupOwner);

    var request = wifiManager.getNetworks();
    request.onsuccess = function(evt) {
      var network = evt.target.result.find(function(network) {
        return groupOwner.ssid === network.ssid &&
               groupOwner.freq === network.frequency;
      });

      if (!network) {
        error(null);
        return;
      }

      success(network);
    };
    request.onerror = function(err) {
      console.warn('Unable to get WiFi networks', err);
      error(err);
    };
  };

  window.connectToGroupOwner = function connectToGroupOwner() {
    getGroupOwnerNetwork(function(network) {
      console.log(window.ntwk = network);

      var request = wifiManager.associate(network);
      request.onsuccess = function(evt) {
        console.log(evt);
      };
      request.onerror = function(err) {
        console.warn('Unable to associate with group owner network', err);
      };
    }, function(error) {
      console.warn('Unable to get group owner network', error);
    });
  };

  wifiP2pManager.addEventListener('enabled', function(evt) {
    console.log('wifiP2pManager::enabled', evt);
  });

  wifiP2pManager.addEventListener('disabled', function(evt) {
    console.log('wifiP2pManager::disabled', evt);
  });

  wifiP2pManager.addEventListener('statuschange', function(evt) {
    console.log('wifiP2pManager::statuschange', evt, evt.peerAddress);

    if (!wifiP2pManager.groupOwner) {
      console.warn('No group owner available');
      return;
    }

    console.log(wifiP2pManager.groupOwner);
    // connectToGroupOwner();
  });

  wifiP2pManager.addEventListener('peerinfoupdate', function(evt) {
    console.log('wifiP2pManager::peerinfoupdate', evt);

    updatePeers();
  });

  // Set the WPS method.
  // wifiManager.wps({ method: 'pbc' });

  // Set the device name that will be shown to nearby peers.
  var deviceName = 'P2P Web Server ' + wifiManager.macAddress;
  wifiP2pManager.setDeviceName(deviceName);

  // Start scanning for nearby peers.
  wifiP2pManager.setScanEnabled(true);

  // Update the list of nearby peers.
  updatePeers();

  navigator.mozSetMessageHandler('wifip2p-pairing-request', function(evt) {
    var accepted = true;
    var pin = ''; // optional
    console.log('wifip2p-pairing-request', evt);
    wifiP2pManager.setPairingConfirmation(accepted, pin);
  });

  var home   = document.getElementById('home');
  var remote = document.getElementById('remote');
  var frame  = document.getElementById('frame');

  window.addEventListener('hashchange', function(evt) {
    var address = window.location.hash.substring(1);
    if (!address) {
      home.style.display = 'block';
      remote.style.display = 'none';

      frame.src = '';
      return;
    }

    home.style.display = 'none';
    remote.style.display = 'block';

    var wpsMethod = 'pbc';
    var goIntent = 1;

    console.log('Attempting to connect to address ' + address + ' ' +
                'with WPS method "' + wpsMethod + '" ' +
                'and intent "' + goIntent + '"');

    wifiP2pManager.connect(address, wpsMethod, goIntent);
  });

  var status = document.getElementById('status');
  var ip     = document.getElementById('ip');
  var port   = document.getElementById('port');
  var start  = document.getElementById('start');
  var stop   = document.getElementById('stop');

  IPUtils.getAddresses(function(ipAddress) {
    ip.textContent = ip.textContent || ipAddress;
  });

  port.textContent = httpServer.port;

  start.addEventListener('click', function() {
    httpServer.start();
    status.textContent = 'Running';
  });

  stop.addEventListener('click', function() {
    httpServer.stop();
    status.textContent = 'Stopped';
  });
});

window.addEventListener('visibilitychange', function(evt) {
  navigator.mozWifiP2pManager.setScanEnabled(false);

  setTimeout(function() {
    navigator.mozWifiP2pManager.setScanEnabled(true);
  }, 5000);
});

window.addEventListener('beforeunload', function() {
  httpServer.stop();
});
