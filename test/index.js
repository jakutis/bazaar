/*global describe, it, bazaar */

describe('factory', function(){
    it('must be a function', function(){
        if(typeof bazaar !== 'function') {
            throw new Error();
        }
    });
});

describe('instance', function() {
    var b = bazaar('../bazaar-worker.js');
    it('must be an object', function() {
        if(typeof b !== 'object') {
            throw new Error();
        }
    });
    it('must not be null', function() {
        if(b === null) {
            throw new Error();
        }
    });
    var handler = null;
    b.listen(function(err, message) {
        handler(err || message);
    });
    it('must receive self broadcasted messages', function(done) {
        var originalMessage = {
            'test': 'foobar'
        };
        handler = function(receivedMessage) {
            if(!(typeof receivedMessage === 'object' &&
                receivedMessage !== null &&
                typeof receivedMessage.test === 'string' &&
                receivedMessage.test === originalMessage.test)) {
                throw new Error('received ' + JSON.stringify(receivedMessage));
            }
            done();
        };
        b.broadcast(originalMessage);
    });
});
