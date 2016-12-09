var kinetic = require('./index.js');
var net = require('net');

var HEADER_SZ = 9;
var connection = {
    host: 'localhost',
    port: '8123'
};
var sequence = 0;

function addSequence() {
    return sequence += 1;
}

function startBatch(connectionID, clusterVersion) {
    var pdu = new kinetic.StartBatchPDU(
        addSequence(), connectionID, clusterVersion, 0);
    const header = pdu.read();
    socket.write(header, err => {
        if (err)
            console.log(err);
        return;
    });
}

var socket = new net.Socket().pause();
socket.setNoDelay();
socket.setKeepAlive(true);

socket.on('connect', () => {
    socket.on('readable', err => {
        const header = socket.read(HEADER_SZ);
        if (header !== null) {
            const protobufSize = header.readInt32BE(1);
            const rawData = socket.read(protobufSize);
            if (rawData !== null) {
                const pdu = new kinetic.PDU(
                    Buffer.concat([header, rawData]));
                console.log(pdu);
                if (pdu.getMessageType() === null){
                    var connectionID = pdu.getConnectionId();
                    var clusterVersion = pdu.getClusterVersion();
                    startBatch();
                }
            }
        }
        return undefined;
    });
});

socket.connect(connection);
