// bazaar.js
/*
Copyright (C) 2012 Vytautas Jakutis <vytautas@jakut.is>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
// store.js https://github.com/marcuswestin/store.js/blob/master/store.js
/* Copyright (c) 2010-2012 Marcus Westin
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
(function (name, context, definition) {
    if (typeof module != 'undefined' && module.exports) {
        module.exports = definition(name, context);
    } else if (typeof define == 'function' && typeof define.amd  == 'object') {
        define(definition);
    } else {
        context[name] = definition(name, context);
    }
})('bazaar', this, function (name, w) {
    return function(workerURL, ns) {
        var broadcast, listen, w3 = !!w.addEventListener, get, set;
        ns = ns || '__bazaar__';

        var test = function(name, obj) {
            try {
                return typeof obj[name] !== 'undefined' && obj[name];
            } catch(e) {
                return false;
            }
        };

        var storage = null;
        if(test('ActiveXObject', w)) {
            (function() {
                var storageOwner, storageContainer;
                // Since #userData storage applies only to specific paths, we need to
                // somehow link our data to a specific path.  We choose /favicon.ico
                // as a pretty safe option, since all browsers already make a request to
                // this URL anyway and being a 404 will not hurt us here.  We wrap an
                // iframe pointing to the favicon in an ActiveXObject(htmlfile) object
                // (see: http://msdn.microsoft.com/en-us/library/aa752574(v=VS.85).aspx)
                // since the iframe access rules appear to allow direct access and
                // manipulation of the document element, even for a 404 page.  This
                // document can be used instead of the current document (which would
                // have been limited to the current path) to perform #userData storage.
                try {
                        storageContainer = new w.ActiveXObject('htmlfile');
                        storageContainer.open();
                        storageContainer.write('<s' + 'cript>document.w=window</s' + 'cript><iframe src="/favicon.ico"></frame>');
                        storageContainer.close();
                        storageOwner = storageContainer.w.frames[0].document;
                        storage = storageOwner.createElement('div');
                } catch(e) {
                        // somehow ActiveXObject instantiation failed (perhaps some special
                        // security settings or otherwse), fall back to per-path storage
                        storage = w.document.createElement('div');
                        storageOwner = w.document.body;
                }
                function withIEStorage(storeFunction) {
                        return function() {
                                var args = Array.prototype.slice.call(arguments, 0);
                                args.unshift(storage);
                                // See http://msdn.microsoft.com/en-us/library/ms531081(v=VS.85).aspx
                                // and http://msdn.microsoft.com/en-us/library/ms531424(v=VS.85).aspx
                                storageOwner.appendChild(storage);
                                storage.addBehavior('#default#userData');
                                storage.load('localStorage');
                                var result = storeFunction.apply(null, args);
                                storageOwner.removeChild(storage);
                                return result;
                        };
                }

                // In IE7, keys may not contain special chars. See all of https://github.com/marcuswestin/store.js/issues/40
                var forbiddenCharsRegex = new RegExp("[!\"#$%&'()*+,/\\\\:;<=>?@[\\]^`{|}~]", "g");
                function ieKeyFix(key) {
                        return key.replace(forbiddenCharsRegex, '___');
                }
                set = withIEStorage(function(storage, key, val) {
                        key = ieKeyFix(key);
                        storage.setAttribute(key, val);
                        storage.save('localStorage');
                });
                get = withIEStorage(function(storage, key) {
                        key = ieKeyFix(key);
                        var value = storage.getAttribute(key);
                        if(typeof value === 'undefined' || value === null) {
                            return '';
                        } else {
                            return value.toString();
                        }
                });
            })();
        } else {
            if(test('localStorage', w)) {
                storage = w.localStorage;
            } else if(test('globalStorage', w) && test(w.location.hostname, w.globalStorage)) {
                storage = w.globalStorage[w.location.hostname];
            }
            if(storage !== null) {
                set = function(key, value) {
                    storage.setItem(key, value);
                };
                get = function(key) {
                    var value = storage.getItem(key);
                    if(typeof value === 'undefined' || value === null) {
                        return '';
                    } else {
                        return value.toString();
                    }
                };
            } else {
                return null;
            }
        }

        if('SharedWorker' in w) {
            (function() {
                broadcast = function(data) {
                    worker.port.postMessage(data);
                };
                var worker = new w.SharedWorker(workerURL);
                listen = function(cb) {
                    if(w3) {
                        worker.port.addEventListener('message', function(e) {
                            cb(e.data);
                        }, false);
                    } else {
                        worker.port.attachEvent('onmessage', function(e) {
                            cb(e.data);
                        });
                    }
                };
                worker.port.start();
            })();
        } else {
            (function() {
                var check, getCount, checkedCount, listeners = [];
                getCount = function() {
                    var count = get(ns + '.count');
                    try {
                        count = parseInt(count, 10);
                        return isNaN(count) ? 0 : count;
                    } catch(e) {
                        return 0;
                    }
                };
                checkedCount = getCount();
                broadcast = function(data) {
                    var count = (getCount() + 1).toString();
                    set(ns + '.' + count, JSON.stringify(data));
                    set(ns + '.count', count);
                };
                listen = function(cb) {
                    listeners.push(cb);
                };
                check = function() {
                    var count = getCount();
                    if(count !== checkedCount) {
                        for(var i = checkedCount + 1; i <= count; i += 1) {
                            var data = JSON.parse(get(ns + '.' + i));
                            for(var j = 0; j < listeners.length; j += 1) {
                                listeners[j](data);
                            }
                        }
                        checkedCount = count;
                    }
                };
                if('onstorage' in w) {
                    if(w3) {
                        w.addEventListener('storage', check, false);
                    } else {
                        w.attachEvent('onstorage', check);
                    }
                } else {
                    w.setInterval(check, 300);
                }
            })();
        }
        return {
            listen : listen,
            broadcast : broadcast
        };
    };
});
