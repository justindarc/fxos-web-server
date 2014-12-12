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

  function updatePeers() {
    var request = wifiP2pManager.getPeerList();
    request.onsuccess = function() {
      var peerList = request.result;

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

  wifiP2pManager.addEventListener('enabled', function(evt) {
    console.log('wifiP2pManager::enabled', evt);
  });

  wifiP2pManager.addEventListener('disabled', function(evt) {
    console.log('wifiP2pManager::disabled', evt);
  });

  wifiP2pManager.addEventListener('statuschange', function(evt) {
    console.log('wifiP2pManager::statuschange', evt);

    var groupOwner = wifiP2pManager.groupOwner;
    if (!groupOwner) {
      console.warn('No group owner available');
      return;
    }

    console.log(groupOwner);
  });

  wifiP2pManager.addEventListener('peerinfoupdate', function(evt) {
    console.log('wifiP2pManager::peerinfoupdate', evt);

    updatePeers();
  });

  // Set the device name that will be shown to nearby peers.
  var deviceName = 'P2P Web Server ' + wifiManager.macAddress;
  wifiP2pManager.setDeviceName(deviceName);

  // Start scanning for nearby peers.
  wifiP2pManager.setScanEnabled(true);

  // Update the list of nearby peers.
  updatePeers();

  // navigator.mozSetMessageHandler('wifip2p-pairing-request', function(evt) {
  //   var accepted = true;
  //   var pin = ''; // Optional

  //   wifiP2pManager.setPairingConfirmation(accepted, pin);
  // });

  // var home   = document.getElementById('home');
  // var remote = document.getElementById('remote');
  // var frame  = document.getElementById('frame');

  // window.addEventListener('hashchange', function(evt) {
  //   var address = window.location.hash.substring(1);
  //   if (!address) {
  //     home.style.display = 'block';
  //     remote.style.display = 'none';

  //     frame.src = '';
  //     return;
  //   }

  //   home.style.display = 'none';
  //   remote.style.display = 'block';

  //   var wpsMethod = 'pbc';
  //   var goIntent = 1;

  //   console.log('Attempting to connect to address ' + address + ' ' +
  //               'with WPS method "' + wpsMethod + '" ' +
  //               'and intent "' + intent + '"');

  //   wifiP2pManager.connect(address, wpsMethod, goIntent);
  // });

  var status = document.getElementById('status');
  var start  = document.getElementById('start');
  var stop   = document.getElementById('stop');

  start.addEventListener('click', function() {
    httpServer.start();
    status.textContent = 'Running';
  });

  stop.addEventListener('click', function() {
    httpServer.stop();
    status.textContent = 'Stopped';
  });
});

window.addEventListener('beforeunload', function() {
  httpServer.stop();
});
