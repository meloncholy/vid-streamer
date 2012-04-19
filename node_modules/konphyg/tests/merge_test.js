var merge = require('../lib/merge');

var test = require('tap').test;

test("a persists when b is null", function(t) {
  var a = {a: 1, b: 2};
  t.similar(merge(a, null), a);
  t.end();
});

test("b persists when a is null", function(t) {
  var b = {a: 1, b: 2};
  t.similar(merge(null, b), b);
  t.end();
});

test("b property persists over a", function(t) {
  var a = {a: 1, b: 2};
  var b = {a: 3};
  var result = merge(a, b);
  t.type(result, "object");
  t.similar(result, {a:3, b:2});
  t.end();
});

test("b object property persists over a", function(t) {
  var a = {a: 1, b: 2};
  var b = {a: {c: 3, d: 4}};
  var result = merge(a, b);
  t.type(result, "object");
  t.similar(result, {a:{c: 3, d: 4}, b:2});
  t.end();
});

test("b normal property persists over a object property", function(t) {
  var a = {a: {c: 3, d: 4}, b:2};
  var b = {a: 1};
  var result = merge(a, b);
  t.type(result, "object");
  t.similar(result, {a:1, b:2});
  t.end();
});

test("b object property is merged with a object property", function(t) {
  var a = {a: {c: 3, d: 4}, b:2};
  var b = {a: {d: 5, e: 6}};
  var result = merge(a, b);
  t.type(result, "object");
  t.similar(result, {a:{c:3,d:5,e:6},b:2});
  t.end();
});