var httpServer = new HTTPServer(8080);

httpServer.addEventListener('request', function(evt) {
  var request = evt.request;
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
</html>`

  console.log(evt);

  evt.response.send(body);
});

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
