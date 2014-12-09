var httpServer = new HTTPServer(8080);

window.addEventListener('load', function() {
  var status = document.getElementById('status');
  var start = document.getElementById('start');
  var stop = document.getElementById('stop');

  start.addEventListener('click', function() {
    if (httpServer.running) {
      return;
    }

    httpServer.start();
    status.textContent = 'Running';
  });

  stop.addEventListener('click', function() {
    if (!httpServer.running) {
      return;
    }

    httpServer.stop();
    status.textContent = 'Stopped';
  });
});

window.addEventListener('beforeunload', function() {
  httpServer.stop();
});
