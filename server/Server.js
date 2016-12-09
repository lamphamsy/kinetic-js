'use strict'; // eslint-disable-line

const kinetic = require('../lib/kinetic');

const net = require('net');
const util = require('util');

const HEADER_SZ = 9;

/**
 * Represents the Kinetic Protocol Data Structure.
 */
class Simulator extends net.Server {
    /**
     * @constructor
     * @param {Buffer} input - An optional input buffer to parse the Kinetic
     *                         message from
     * @throws {Error} - err.badVersion is set the version is incompatible,
     *                 - err.badLength is set if the buffer size is incoherent,
     *                 - err.decodingError is the protobuf is not decodable,
     *                 - err.hmacFail is set if the HMAC does not match,
     *                 - err.badTypeInput is set if the input is not a Buffer.
     * @returns {Kinetic} - to allow for a functional style.
     */
    constructor(port, clusterVersion) {
        super();

        this._port = port;
        this._clusterVersion = clusterVersion || 0;
        this._data = Buffer.allocUnsafe(0);
        this._db = {};
        this._header;
        this._protobufSize;
        this._bind();

        /*
         * From Kinetic official documentation, a Kinetic Protocol Data Unit
         * (PDU) is composed of:
         * - header   -- A 9-byte-long header.
         * - protobuf -- A Protocol Buffer message, containing operation
         *               metadata & key-value metadata.
         * - chunk    -- The value to store/read. For performance reasons, the
         *               chunk is not copied into the PDU object; the client is
         *               responsible for reading or writing it.
         */
        // this._command = undefined;  // the object-typed command that gets
        //                             // converted into the protobuf (made of
        //                             // bytes)
        // this._chunkSize = 0;


        // if (input !== undefined) {
        //     if (!Buffer.isBuffer(input))
        //         throw propError("badTypeInput", "input is not a buffer");
        //     this._parse(input);
        // }
        // return this;
    }

    _bind() {
        this.on('connection', socket => {
            console.log('--- connection' );
            const initPdu = new kinetic.InitPDU(
                this._makeLogs(), this.getClusterVersion());
            socket.write(initPdu.read());
            socket.pause();
            socket.on('readable', () => {
                if (!this._header) {
                    this._header = socket.read(HEADER_SZ);
                    this._protobufSize = this._header.readInt32BE(1);
                    console.log('header');
                    console.log(this._header);
                    console.log('protobufSize');
                    console.log(this._protobufSize);
                }
                if (this._header) {
                    if (!this._data || this._data.length < this._protobufSize){
                        this._data = socket.read(this._protobufSize);
                    }
                    if (this._data || this._data.length === this._protobufSize) {
                        const pdu = new kinetic.PDU(
                            Buffer.concat([this._header, this._data]));
                        if (pdu.getMessageType() !== kinetic.ops.PUT) {
                            this._sendResponse(socket, pdu);
                        } else {

                            const fullSize = HEADER_SZ
                                  + pdu.getProtobufSize()
                                + pdu.getChunkSize();
                        }
                    }
                }
            });
            // socket.read()
            // socket.on('data', data => {
            //     console.log(data);
            //     this._data = data;
            //     const pdu = new kinetic.PDU(data);
            //     this._sendResponse(socket, pdu);
            // });
        }).on('close', () => {
            console.log('--- connection closed');
        }).on('listening', () => {
            console.log('--- listening on');
            console.log(this.address());
        }).on('error', err => {
            console.log('--- error : ')
        });
    }

    _sendResponse(socket, pdu) {
        console.log(util.inspect(pdu, false, null));
        switch (pdu.getMessageType()) {
        case kinetic.ops.NOOP:
            socket.resume();
            socket.write(
                new kinetic.NoOpResponsePDU(pdu.getSequence(),
                                            kinetic.errors.SUCCESS,
                                            '').read());
            break;
        case kinetic.ops.PUT:
            socket.pause();
            console.log('============ chunk size');
            console.log(pdu.getChunkSize());
            let test = socket.read(pdu.getChunkSize());
            while(test === null) {
                test = socket.read(pdu.getChunkSize());
                console.log(test);
            }
            socket.write(
                new kinetic.PutResponsePDU(pdu.getSequence(),
                                            kinetic.errors.SUCCESS,
                                           '').read());

            // this._db[pdu.getKey()] = this._data.slice(
            //     this._data.length - pdu.getChunkSize(), this._data.length);
            // console.log(this._db[pdu.getKey()].toString());
            break;
        case kinetic.ops.GET:
            socket.write(
                new kinetic.GetResponsePDU(pdu.getSequence(),
                                           kinetic.errors.SUCCESS,
                                           '', pdu.getKey() ).read());
            break;
        default:
            //Statements executed when none of the values match the value of the expression
            break;
        }
    }

    _makeLogs() {
         return {
            types: [],
            utilizations: [],
            temperatures: [],
            capacity: null,
            configuration: {
                vendor: 'Seagate',
                model: 'Simulator',
                serialNumber: Buffer.from('qwerty1234', 'utf8'),
                worldWideName: Buffer.from('kinetic', 'utf8'),
                version: '0.8.0.4-SNAPSHOT',
                compilationDate: 'Wed Nov 18 20:08:27 CET 2015',
                sourceHash: '4026da95012a74f137005362a419466dbcb2ae5a',
                protocolVersion: '3.0.6',
                protocolCompilationDate: 'Wed Nov 18 20:08:27 CET 2015',
                protocolSourceHash: 'a5e192b2a42e2919ba3bba5916de8a2435f81243',
                interface: [{
                    name: 'wlan0',
                    MAC: '28:b2:bd:94:e3:28',
                    ipv4Address: '127.0.0.1',
                    ipv6Address: '::1:'
                }, {
                    name: 'lo',
                    MAC: null,
                    ipv4Address: '127.0.0.1',
                    ipv6Address: '::1:'
                }],
                port: 8123,
                tlsPort: 8443
            },
            statistics: [],
            messages: null,
            limits: {
                maxKeySize: 4096,
                maxValueSize: 1048576,
                maxVersionSize: 2048,
                maxTagSize: 4294967295,
                maxConnections: 4294967295,
                maxOutstandingReadRequests: 4294967295,
                maxOutstandingWriteRequests: 4294967295,
                maxMessageSize: 4294967295,
                maxKeyRangeCount: 200,
                maxIdentityCount: 4294967295,
                maxPinSize: null,
                maxOperationCountPerBatch: 15,
                maxBatchCountPerDevice: 5 },
            device: null
        };
    }

    /**
     * Gets the port of the simulator.
     *
     * @returns {String} - the port
     */
    getClusterVersion() {
        return this._clusterVersion;
    }

    /**
     * Gets the port of the simulator.
     *
     * @returns {String} - the port
     */
    getPort() {
        return this._port;
    }

    /**
     * Start the simulator.
     *
     */
    start(){
        this.listen(this.getPort());
    }
}

module.exports = {
    Simulator,
};
