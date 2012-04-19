function mergeProperty(a, b, prop) {
  var aValue, bValue;
  
  if (a.hasOwnProperty(prop)) {
    if (b.hasOwnProperty(prop)) {
      aValue = a[prop];
      bValue = b[prop];
      if (typeof(aValue) === 'object' && typeof(bValue) === 'object') {
        a[prop] = merge(aValue, bValue);
      } else {
        a[prop] = bValue;
      }
    }
  } else {
    a[prop] = b[prop];
  }
};

function clone(o) {
  if (o === undefined) { return undefined; }
  var json = JSON.stringify(o);
  return JSON.parse(json);
};
  
function merge(a, b) {
  var prop, bValue;
  a = clone(a);
  b = clone(b);
  
  if (b === null || b === undefined) {
    return a;
  }
  if (a === null || a === undefined) {
    return b;
  }
  
  for (prop in a) {
    mergeProperty(a, b, prop);
  }
  for (prop in b) {
    mergeProperty(a, b, prop);
  }

  return a;
};

module.exports = merge;