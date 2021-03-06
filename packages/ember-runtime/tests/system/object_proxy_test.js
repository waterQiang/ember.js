module("Ember.ObjectProxy");

testBoth("should proxy properties to content", function(get, set) {
  var content = {firstName: 'Tom', lastName: 'Dale'},
      proxy = Ember.ObjectProxy.create();

  equal(get(proxy, 'firstName'), undefined);
  set(proxy, 'firstName', 'Foo');
  equal(get(proxy, 'firstName'), undefined);

  set(proxy, 'content', content);

  equal(get(proxy, 'firstName'), 'Tom');
  equal(get(proxy, 'lastName'), 'Dale');
  equal(get(proxy, 'foo'), undefined);

  set(proxy, 'lastName', 'Huda');

  equal(get(content, 'lastName'), 'Huda');
  equal(get(proxy, 'lastName'), 'Huda');

  set(proxy, 'content', {firstName: 'Yehuda', lastName: 'Katz'});

  equal(get(proxy, 'firstName'), 'Yehuda');
  equal(get(proxy, 'lastName'), 'Katz');
});

testBoth("should work with watched properties", function(get, set) {
  var content1 = {firstName: 'Tom', lastName: 'Dale'},
    content2 = {firstName: 'Yehuda', lastName: 'Katz'},
    Proxy,
    proxy,
    count = 0,
    last;

  Proxy = Ember.ObjectProxy.extend({
    fullName: Ember.computed(function () {
      var firstName = this.get('firstName'),
          lastName = this.get('lastName');
      if (firstName && lastName) {
        return firstName + ' ' + lastName;
      }
      return firstName || lastName;
    }).property('firstName', 'lastName')
  });

  proxy = Proxy.create();

  Ember.addObserver(proxy, 'fullName', function () {
    last = get(proxy, 'fullName');
    count++;
  });

  // proxy without content returns undefined
  equal(get(proxy, 'fullName'), undefined);

  // setting content causes all watched properties to change
  set(proxy, 'content', content1);
  // both dependent keys changed
  equal(count, 2);
  equal(last, 'Tom Dale');

  // setting property in content causes proxy property to change
  set(content1, 'lastName', 'Huda');
  equal(count, 3);
  equal(last, 'Tom Huda');

  // replacing content causes all watched properties to change
  set(proxy, 'content', content2);
  // both dependent keys changed
  equal(count, 5);
  equal(last, 'Yehuda Katz');
  // content1 is no longer watched
  ok(!Ember.isWatching(content1, 'firstName'), 'not watching firstName');
  ok(!Ember.isWatching(content1, 'lastName'), 'not watching lastName');

  // setting property in new content
  set(content2, 'firstName', 'Tomhuda');
  equal(last, 'Tomhuda Katz');
  equal(count, 6);

  // setting property in proxy syncs with new content
  set(proxy, 'lastName', 'Katzdale');
  equal(count, 7);
  equal(last, 'Tomhuda Katzdale');
  equal(get(content2, 'firstName'), 'Tomhuda');
  equal(get(content2, 'lastName'), 'Katzdale');
});

test("setPath and getPath should work", function () {
  var content = {foo: {bar: 'baz'}},
      proxy = Ember.ObjectProxy.create({content: content}),
      count = 0;
  proxy.setPath('foo.bar', 'hello');
  equal(proxy.getPath('foo.bar'), 'hello');
  equal(proxy.getPath('content.foo.bar'), 'hello');

  proxy.addObserver('foo.bar', function () {
    count++;
  });

  proxy.setPath('foo.bar', 'bye');

  equal(count, 1);
  equal(proxy.getPath('foo.bar'), 'bye');
  equal(proxy.getPath('content.foo.bar'), 'bye');
});

testBoth("should transition between watched and unwatched strategies", function(get, set) {
  var content = {foo: 'foo'},
      proxy = Ember.ObjectProxy.create({content: content}),
      count = 0;

  function observer() {
    count++;
  }

  equal(get(proxy, 'foo'), 'foo');

  set(content, 'foo', 'bar');

  equal(get(proxy, 'foo'), 'bar');

  set(proxy, 'foo', 'foo');

  equal(get(content, 'foo'), 'foo');
  equal(get(proxy, 'foo'), 'foo');

  Ember.addObserver(proxy, 'foo', observer);

  equal(count, 0);
  equal(get(proxy, 'foo'), 'foo');

  set(content, 'foo', 'bar');

  equal(count, 1);
  equal(get(proxy, 'foo'), 'bar');

  set(proxy, 'foo', 'foo');

  equal(count, 2);
  equal(get(content, 'foo'), 'foo');
  equal(get(proxy, 'foo'), 'foo');

  Ember.removeObserver(proxy, 'foo', observer);

  set(content, 'foo', 'bar');

  equal(get(proxy, 'foo'), 'bar');

  set(proxy, 'foo', 'foo');

  equal(get(content, 'foo'), 'foo');
  equal(get(proxy, 'foo'), 'foo');
});