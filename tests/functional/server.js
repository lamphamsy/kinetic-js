const net = require('net');
const kinetic = require('../../lib/kinetic');
const util = require('util');

const HEADER_SZ = 9;

const options = {
    host: 'localhost',
    port: '8123',
};

const socket = new net.Socket();
socket.on('data', data => {
    console.log(data);
    const header = data.slice(0, HEADER_SZ);
    console.log(header);
    const protobufSize = header.readInt32BE(1);
    const pdu = new kinetic.PDU(data);
    console.log(util.inspect(pdu, {showHidden: false, depth: null}));
    if (pdu.getMessageType() === null){
        console.log('halo');
        const noopPdu = new kinetic.NoOpPDU(0, 0, 0);
        console.log(util.inspect(noopPdu, false, null));
        socket.write(noopPdu.read());
    }
});

socket.connect(options);
