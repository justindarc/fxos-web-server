suite('HTTPServer', function() {
  /*jshint esnext:true*/
  'use strict';

  suiteSetup(function() {

  });

  suiteTeardown(function() {

  });

  setup(function() {

  });

  teardown(function() {

  });

  suite('HTTPServer()', function() {
    test('Should set TCP port', function() {
      var httpServer = new HTTPServer(1234);

      assert.equal(httpServer.port, 1234);
    });
  });
});
