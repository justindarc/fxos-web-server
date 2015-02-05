var httpServer = new HTTPServer(8080);

httpServer.addEventListener('request', function(evt) {
  var request  = evt.request;
  var response = evt.response;
  
  console.log(request);

  var image = document.getElementById('image');

  var file = request.body && request.body.file && request.body.file.value;
  if (file) {
    file = BinaryUtils.stringToArrayBuffer(file);
    image.src = URL.createObjectURL(new Blob([file]));
  }

  var body =
`<!DOCTYPE html>
<html>
<head>
  <title>Firefox OS Web Server</title>
</head>
<body>
  <h1>Hello World!</h1>
  <h3>If you can read this, the Firefox OS Web Server is operational!</h3>
  <form method="POST" action="." enctype="multipart/form-data">
    <p>
      <label>File:</label>
      <input type="file" name="file">
    </p>
    <p>
      <label>Description:</label>
      <textarea name="description"></textarea>
    </p>
    <input type="submit" value="Submit">
  </form>
</body>
</html>`;

  response.send(body);
});

window.addEventListener('load', function() {
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

window.addEventListener('beforeunload', function() {
  httpServer.stop();
});
