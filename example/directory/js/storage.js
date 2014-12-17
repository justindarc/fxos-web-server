window.Storage = (function() {

  function Storage(name) {
    this.ds = navigator.getDeviceStorage(name);
  }

  Storage.prototype.constructor = Storage;

  Storage.prototype.list = function(path, callback) {
    if (typeof callback !== 'function') {
      return;
    }

    var root = '/' + this.ds.storageName + '/';
    var tree = {};

    var cursor = this.ds.enumerate();
    cursor.onsuccess = function() {
      var file = this.result;
      if (!file) {
        callback(resolvePathForTree(path, tree));
        return;
      }

      var parent = tree;

      var keys = file.name.substring(root.length).split('/');
      var length = keys.length;
      for (var i = 0, key; i < length; i++) {
        key = keys[i];
        parent = parent[key] = (i === length - 1) ? file : (parent[key] || {});
      }

      this.continue();
    };
  };

  function resolvePathForTree(path, tree) {
    if (path.indexOf('/') === 0) {
      path = path.substring(1);
    }

    if (!path) {
      return tree;
    }

    var keys = path.split('/');
    var length = keys.length;
    for (var i = 0, key; i < length; i++) {
      key = keys[i];
      tree = tree[key];

      if (!tree) {
        return null;
      }
    }

    return tree;
  }

  return Storage;

})();
