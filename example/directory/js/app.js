var httpServer = new HTTPServer(8080);
var storage = new Storage('sdcard');

httpServer.addEventListener('request', function(evt) {
  var request  = evt.request;
  var response = evt.response;

  if (request.path.substr(-1) === '/') {
    request.path = request.path.substring(0, request.path.length - 1);
  }

  console.log(request);

  var path = decodeURIComponent(request.path) || '/';

  storage.list(path, function(directory) {
    if (directory instanceof File) {
      response.headers['Content-Type'] = directory.type;
      response.sendFile(directory);
      return;
    }

    var baseHref = request.path;
    if (baseHref !== '/') {
      baseHref += '/';
    }

    var rows = [];
    for (var name in directory) {
      rows.push('<tr>' +
        '<td>' +
          '<a href="' + baseHref + encodeURIComponent(name) + '">' +
            name +
          '</a>' +
        '</td>' +
        '<td>' +
          (directory[name] instanceof File ? 'File' : 'Folder') +
        '</td>' +
        '<td>' +
          (directory[name] instanceof File ? directory[name].size : '--') +
        '</td>' +
        '<td>' +
          (directory[name] instanceof File ? directory[name].lastModifiedDate.toLocaleFormat() : '--') +
        '</td>' +
      '</tr>');
    }

    rows = rows.join('');

    var body =
`<!DOCTYPE html>
<html>
<head>
  <title>Firefox OS Web Server</title>
  <style>
  table { width: 100%; }
  th { text-align: left; }
  </style>
</head>
<body>
  <h1>Index of ${path}</h1>
  <p>
    <a href="${baseHref}../">Up to parent level</a>
  </p>
  <table>
    <thead>
      <tr>
        <th>Name</th>
        <th>Type</th>
        <th>Size</th>
        <th>Last Modified</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`;

    response.send(body);
  });
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
