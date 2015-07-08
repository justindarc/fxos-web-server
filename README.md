# Firefox OS Web Server

> A basic HTTP server for Firefox OS, written in JavaScript!

## Installing it

```bash
npm install git+https://github.com/justindarc/fxos-web-server.git
```

## Using it

```javascript

// Require the server code
var HTTPServer = require('fxos-web-server');

// Make an instance listening in port 80
var server = new HTTPServer(80);

// Listen to request events
server.addEventListener('request', function(evt) {

	// To make things simple, we'll respond by displaying the request path
	var responseText = evt.request.path;
	var response = evt.response;
	response.send(responseText);

});

// Finally start the server
server.start();

// (you can stop it afterwards with server.stop())

```

You can also have a look at the examples in the `example` folder.
