var ports = [];
var addPort = function(port) {
    ports.push(port);
    port.onmessage = function(e) {
        for(var i = 0; i < ports.length; i += 1) {
            ports[i].postMessage(e.data);
        }
    };
};
onconnect = function(e) {
    for(var i = 0; i < e.ports.length; i+=1) {
        addPort(e.ports[i]);
    }
};
