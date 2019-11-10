const indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB
const baseName = "zm_zeroapp"
const storeName = "v1"

function logerr(err) {
  console.log(err);
}

function connectDB(f) {
  var request = indexedDB.open(baseName, 1);
  request.onerror = logerr;
  request.onsuccess = function () {
    f(request.result);
  }
  request.onupgradeneeded = function (e) {
    e.currentTarget.result.createObjectStore(storeName, {keyPath: "k"});
    connectDB(f);
  }
}

function getValue(key, callback) {
  connectDB(function (db) {
    var request = db.transaction([storeName], "readonly").objectStore(storeName).get(key);
    request.onerror = logerr;
    request.onsuccess = function () {
      callback(request.result ? request.result : -1);
    }
  });
}

function setValue(key, value) {
  connectDB(function (db) {
    var request = db.transaction([storeName], "readwrite").objectStore(storeName).put({
      k: key,
      v: value
    });
    request.onerror = logerr;
    request.onsuccess = function () {
      return request.result;
    }
  });
}

function removeValue(key) {
  connectDB(function (db) {
    var request = db.transaction([storeName], "readwrite").objectStore(storeName).delete(key);
    request.onerror = logerr;
    request.onsuccess = function () {
      // console.log("Delete key from DB:", key);
    }
  });
}

const IndexedDB = {}
IndexedDB.set = (key, value) => {
  setValue(key, JSON.stringify(value))
}
IndexedDB.get = key => getValue(key, (v) => {
  let result;
  if (v === -1) {
    return result
  }

  try {
    result = JSON.parse(v.v)
  } catch (e) {
    logerr(e)
  }
  return result
})
IndexedDB.remove = key => removeValue(key)
IndexedDB.clear = () => IndexedDB.clear()

export default IndexedDB
