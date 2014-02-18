# bazaar

A publish-subscribe (broadcast-listen) layer for same-origin inter-window communication.

- [Overview](#overview)
- [Installation](#installation)
- [API](#api)
- [Development](#development)

## Overview

* Let's you broadcast messages to all opened windows, which are listening.
* Tested on these web browsers:
  * Mozilla Firefox 2.0+
  * Opera 10.50+
  * Google Chrome 5+
  * Microsoft Internet Explorer 6+
  * Apple Safari 4.0+

## Installation

  Install manually by adding to your HTML file:

    <script src="/path/to/bazaar/bazaar.js"></script>

  Install with [npm](https://www.npmjs.org/package/bazaar):

    $ npm install --save bazaar

  Install with [component](http://component.io/jakutis/bazaar):

    $ component install jakutis/bazaar

  Install with [bower](http://bower.io):

    $ bower install --save bazaar

## API

[demo code](https://jakut.is/demos/bazaar/)

    // '/bazaar-worker.js' specifies the url of worker script
    // 'hub1' specifies the namespace, this argument is optional, default is '__bazaar__'
    var hub = window.bazaar('/bazaar-worker.js', 'hub1');

    if(hub === null) {
        alert('your web browser is not supported');
    } else {
        document.onmousedown = function() {
            hub.broadcast(new Date().getTime());
        };
        hub.listen(function(err, ts) {
            if(err) {
                return alert("An error occurred when receiving a message.");
            }
            alert(ts);
        });
    }

## Development

    TODO
