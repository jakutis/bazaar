# Bazaar

Description: A publish-subscribe (broadcast-listen) layer for same-origin inter-window communication

Home page: [jakut.is/git/BAZAAR/about](https://jakut.is/git/BAZAAR/about/)

[npm](https://npmjs.org) package: [bazaar](https://npmjs.org/package/bazaar)

[jam](http://jamjs.org) package: [bazaar](http://jamjs.org/packages/#/details/bazaar)

License: [MIT](https://jakut.is/git/BAZAAR/plain/LICENSE)

Author: [Vytautas Jakutis](https://jakut.is)

# Example usage

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
        hub.listen(function(ts) {
            alert(ts);
        });
    }


# Supported browsers

  - Mozilla Firefox 2.0+
  - Opera 10.50+
  - Google Chrome 5+
  - Microsoft Internet Explorer 6+
  - Apple Safari 4.0+
