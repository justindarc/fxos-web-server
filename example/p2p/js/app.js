var httpServer = new HTTPServer(8080);

httpServer.addEventListener('request', function(evt) {
  var request  = evt.request;
  var response = evt.response;

  var message = document.getElementById('message').value;

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
  <h3>Message</h3>
  <pre>${message}</pre>
</body>
</html>`;

  response.send(body);
});

window.addEventListener('load', function() {
  if (!window.P2PHelper) {
    alert('WiFi Direct is not available on this device');
    window.close();
    return;
  }

  var peers = document.getElementById('peers');

  P2PHelper.addEventListener('peerlistchange', function(evt) {
    peers.innerHTML = '';

    evt.peerList.forEach(function(peer) {
      var li = document.createElement('li');
      li.dataset.address = peer.address;
      li.dataset.status = peer.connectionStatus;

      var a = document.createElement('a');
      a.href = '#' + peer.address;
      a.textContent = peer.name;

      li.appendChild(a);
      peers.appendChild(li);
    });
  });

  var reloadInterval;

  P2PHelper.addEventListener('connected', function(evt) {
    frame.src = 'http://' + evt.groupOwner.ipAddress + ':8080';

    reloadInterval = setInterval(function() {
      frame.reload();
    }, 1000);
  });

  P2PHelper.addEventListener('disconnected', function(evt) {
    frame.src = '';

    clearInterval(reloadInterval);
  });

  // Set the device name that will be shown to nearby peers.
  P2PHelper.setDisplayName('P2P Web Server ' + P2PHelper.localAddress);

  // Start scanning for nearby peers.
  P2PHelper.startScan();

  var home   = document.getElementById('home');
  var remote = document.getElementById('remote');
  var frame  = document.getElementById('frame');

  window.addEventListener('hashchange', function(evt) {
    var address = window.location.hash.substring(1);
    if (!address) {
      home.style.display = 'block';
      remote.style.display = 'none';

      P2PHelper.disconnect();
      return;
    }

    home.style.display = 'none';
    remote.style.display = 'block';

    P2PHelper.connect(address);
  });

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

window.addEventListener('visibilitychange', function(evt) {
  P2PHelper.restartScan();
});

window.addEventListener('beforeunload', function() {
  httpServer.stop();

  P2PHelper.disconnect();
  P2PHelper.stopScan();
});
