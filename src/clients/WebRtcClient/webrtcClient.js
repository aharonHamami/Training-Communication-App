import { io } from 'socket.io-client';

export default class RtcClient {
    #connected;
    #listeners;
    #localStream;
    #usersPeerMap;
    #socket;
    
    /**
     * initial the client and start a connection to the signaling server
     * @constructor
     * @param {{signalingServer, webRtcServers}} servers - the servers information
     */
    constructor(servers) {
        this.#connected = false;
        
        this.#listeners = {}; // events: 'connected', 'stream', 'new-users', 'user-left'
        
        this.#localStream = null;
        this.#usersPeerMap = []; // [{id: 'userId', peerConnection: 'rtcPeerConnection', stream: 'stream'}]
        
        this.servers = servers;
        this.#socket = io(this.servers.signalingServer.url, {
            autoConnect: false,
            transports: ['websocket'],
            query: {
                token: this.servers.signalingServer.token
            }
        });
        
        // socket.onAny((event, ...args) => {
        //     console.log(event, args);
        // });
        
        this.#socket.on("connect", () => {
            console.log("connected to server with socket.io");
        });
    }

    /**
     * listen to an event
     * @param {String} eventName - event name that will be callen on emit
     * @param {Function} callback - callback function
     */
    on(eventName, callback) {
        if (!this.#listeners[eventName]) {
            this.#listeners[eventName] = [];
        }
        this.#listeners[eventName].push(callback);
    }

    /**
     * emit an event
     * @param {String} eventName - event name to emit
     * @param  {...any} args - arguments to pass to the callback
     */
    emit(eventName, ...args) {
        if (this.#listeners[eventName]) {
            this.#listeners[eventName].forEach(callback => {
                try{
                    callback(...args)
                }catch(e) {
                    console.log('<< WebRTC client event error: >>\n', e);
                }
            });
        }
    }
    
    /**
     * connect to the server and get peer connection to other users
     * @param {{userId, roomId}} auth - authentication information
     * @param {MediaStream} stream - the media stream of the user
     */
    async connect(auth, stream) {
        this.#localStream = stream;
        
        this.#socket.auth = auth;
        this.#socket.connect();
        
        this.#socket.on('welcome', connectedUsers => {
            this.#connected = true;
            
            const usersArray = connectedUsers.map(user => ({
                id: user.id,
                name: user.name
            }));
            
            // console.log('connected users: ', usersArray);
            
            this.emit('connected', usersArray);
        });
        
        this.#socket.on('user-joined', (userId, userName) => {
            console.log(`user ${userName} (${userId}) joined`);
            
            this.#createPeerConnection(userId)
                .then(() => {
                    console.log(`send offer to ${userId}`);
                    this.#sendOffer(userId);
                })
                .catch(error => {
                    console.log("Error: couldn't create peer connection\n", error);
                });
            
            this.emit('new-users', [{ id: userId, name: userName }]);
        });
        
        this.#socket.on('user-left', userId => {
            const index = this.#usersPeerMap.findIndex(u => u.id === userId);
            console.log('removing index ', index);
            this.#usersPeerMap.splice(index, 1);
            
            this.emit('user-left', userId);
        });
        
        this.#socket.on('message-from-peer', async (userId, message) => {
            console.log(`member ${userId} sent a message`, message);
            switch(message.type) {
                case 'offer':
                    await this.#createPeerConnection(userId);
                    await this.#sendAnswer(userId, message.offer);
                    break;
                case 'answer':
                    await this.#addAnswer(userId, message.answer);
                    break;
                case 'candidate': // when we get an ICE candidate
                    await this.#addIceCandidate(userId, message.candidate);
                    break;
                default:
                    console.log("couldn't understand the message type");
            }
        });
    }
    
    /**
     * disconnect from the signalling server and from all the peers
     */
    async disconnect() {
        console.log('disconnect from the server');
        this.#socket.disconnect();
        this.#connected = false;
        this.#socket.removeAllListeners();
        
        console.log('removing tracks');
        
        // others tracks
        this.#usersPeerMap.forEach(user => {
            user.stream.getTracks().forEach(track => {
                track.stop();
            });
        });
        
        this.#usersPeerMap = [];
    }
    
    isConnected() {
        return this.#connected;
    }
    
    /**
     * Create a WebRTC peer connection
     * @param {String} otherUserId - the membeer id to create the peer with
     */
    async #createPeerConnection(otherUserId) {
        const peerConnection = new RTCPeerConnection(this.servers.webRtcServers);
        
        // send my tracks to the other peer
        this.#localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, this.#localStream);
        });
        
        const remoteStream = new MediaStream();
        
        // get the other peer's tracks and add them to his streams
        peerConnection.ontrack = event => {
            event.streams[0].getTracks().forEach(track => {
                console.log('track');
                remoteStream.addTrack(track);
            });
            
            this.emit('stream', remoteStream, otherUserId);
        }
        
        // this.emit('stream', remoteStream, otherUserId);
        
        // generation ICE candidates and sending them to the other peer (by signaling)
        peerConnection.onicecandidate = async event => {
            if(event.candidate) { // << check what does it means and what event has in general >>
                this.#socket.emit('send-message', otherUserId, {type: "candidate", candidate: event.candidate});
            }
        }
        
        this.#usersPeerMap.push({id: otherUserId, peerConnection: peerConnection, stream: remoteStream});
    }
    
    /**
     * send WebRTC offer to a specific peer
     * this method can only be called after creating peer connection
     * @param {String} otherUserId - user's peer id
     */
    async #sendOffer(otherUserId) {
        const peerConnection = this.#usersPeerMap.find(user => user.id === otherUserId).peerConnection;
        
        // create offer:
        let offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        // console.log('our offer: ', offer);
        
        this.#socket.emit('send-message', otherUserId, {type: "offer", offer: offer});
    }
    
    /**
     * Add the given WebRTC offer and send a WebRTC answer to the peer
     * @param {String} otherUserId - user's peer id
     * @param {*} offer - WebRTC offer from the peer
     */
    async #sendAnswer(otherUserId, offer) {
        const peerConnection = this.#usersPeerMap.find(user => user.id === otherUserId).peerConnection;
        
        // set the offer we got as the remote description
        await peerConnection.setRemoteDescription(offer);
        
        // create answer:
        let answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        
        this.#socket.emit('send-message', otherUserId, {type: "answer", answer: answer});
    }
    
    /**
     * Add the given WebRTC offer
     * @param {String} otherUserId - user's peer id
     * @param {*} answer - WebRTC answer from the peer
     */
    async #addAnswer(otherUserId, answer) {
        const peerConnection = this.#usersPeerMap.find(user => user.id === otherUserId).peerConnection;
        
        if(!peerConnection.currentRemoteDescription) {
            peerConnection.setRemoteDescription(answer);
        }
    }
    
    /**
     * add a WebRTC ice candidate
     * @param {String} otherUserId - user's peer id
     * @param {*} candidate - a WebRTC ice candidate
     */
    async #addIceCandidate(otherUserId, candidate) {
        const otherUser = this.#usersPeerMap.find(user => user.id === otherUserId);
        
        if(otherUser && otherUser.peerConnection) {
            // we add a ICE candidate so both sides will have the efficient way to communicate
            otherUser.peerConnection.addIceCandidate(candidate);
        }
    }
}