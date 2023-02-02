import classes from './communication.module.css';

import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

import SidePanel from '../../ComponentsUI/Sidebar/SidePanel';
import SideButton from '../../ComponentsUI/Sidebar/SideButton/SideButton';

const servers = {
    socketIoServer: "http://"+window.location.hostname+":3005",
    webRtcServers: {
        iceServers: [
            {
                urls: ['stun:stun1.l.google.com:19302', 'stun:stun1.l.google.com:19302']
            }
        ]
    }
};

let localStream;
const usersPeerMap = []; // [{id: 'userId', peerConnection: 'rtcPeerConnection', stream: 'stream'}]

const client = io(servers.socketIoServer, { autoConnect: false, transports: ['websocket'] });

// socket.onAny((event, ...args) => {
//     console.log(event, args);
// });

client.on("connect", () => {
    console.log("connected to server with socket.io");
})

async function createPeerConnection(otherUserId) {
    const peerConnection = new RTCPeerConnection(servers.webRtcServers);
    
    // if for some reason we didnt have local stream before we will ask for it now
    if(!localStream) {
        localStream = await navigator.mediaDevices.getUserMedia({video: true, audio: false}); // getting access to the user media
    }
    
    // send my tracks to the other peer
    localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
    });
    
    const remoteStream = new MediaStream();
    // get the other peer's tracks and add them to his streams
    peerConnection.ontrack = event => {
        // << need to check about the index of 'RTCTrackEvent.streams' >>
        event.streams[0].getTracks().forEach(track => {
            console.log('track');
            remoteStream.addTrack(track);
        });
    }
    // play his stream:
    const audio = new Audio();
    audio.srcObject = remoteStream;
    audio.play();
    
    // generation ICE candidates and sending them to the other peer (by signaling)
    peerConnection.onicecandidate = async event => {
        if(event.candidate) { // << check what does it means and what event has in general >>
            client.emit('send-message', otherUserId, {type: "candidate", candidate: event.candidate});
        }
    }
    
    usersPeerMap.push({id: otherUserId, peerConnection: peerConnection, stream: remoteStream});
}

// can only be called after creating peer connection
async function sendOffer(otherUserId) {
    const peerConnection = usersPeerMap.find(user => user.id === otherUserId).peerConnection;
    
    // create offer:
    let offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    // console.log('our offer: ', offer);
    
    client.emit('send-message', otherUserId, {type: "offer", offer: offer});
}

// add the offer and send an answer
async function sendAnswer(otherUserId, offer) {
    const peerConnection = usersPeerMap.find(user => user.id === otherUserId).peerConnection;
    
    // set the offer we got as the remote description
    await peerConnection.setRemoteDescription(offer);
    
    // create answer:
    let answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    
    client.emit('send-message', otherUserId, {type: "answer", answer: answer});
}

async function addAnswer(otherUserId, answer) {
    const peerConnection = usersPeerMap.find(user => user.id === otherUserId).peerConnection;
    
    if(!peerConnection.currentRemoteDescription) {
        peerConnection.setRemoteDescription(answer);
    }
}

async function addIceCandidate(otherUserId, candidate) {
    const otherUser = usersPeerMap.find(user => user.id === otherUserId);
    
    if(otherUser && otherUser.peerConnection) {
        // we add a ICE candidate so both sides will have the efficient way to communicate
        otherUser.peerConnection.addIceCandidate(candidate);
    }
}

const Communication = () => {
    const [usersInfo, setUsersInfo] = useState([]);
    /*{id: 123, name: 'hello', signed: false},
    {id: 456, name: 'world', signed: false},
    {id: 789, name: 'first name', signed: true},
    {id: 929, name: 'first name', signed: true},
    {id: 548, name: 'second name', signed: false}*/
    
    const [soundInfo] = useState([
        {name: 'sound1.png'},
        {name: 'sound2.png'},
        {name: 'sound3.png'},
        {name: 'sound4.png'}
    ]);
    
    useEffect(() => {
        navigator.mediaDevices.getUserMedia({video: false, audio: true})
            .then(stream => {
                localStream = stream;
            })
            .catch(error => {
                console.log("error: couldn't get user media\n", error);
            });
        
        const myUserInfo = {
            id: String(Math.floor(Math.random() * 10000)),
            name: 'aharon'+Math.floor(Math.random() * 100),
            signed: true
        };
        setUsersInfo(state => [
            {...myUserInfo, name: myUserInfo.name+' (you)'},
            ...state
        ]);
        
        client.auth = {
            userId: myUserInfo.id,
            userName: myUserInfo.name,
            roomId: 'main'
        };
        console.log('trying to connect to the server...');
        client.connect();
        
        client.on('welcome', connectedUsers => {
            const usersArray = connectedUsers.map(user => ({
                id: user.id,
                name: user.name,
                signed: true
            }));
            
            setUsersInfo(state => [
                ...state,
                ...usersArray
            ]);
        });
        
        client.on('user-joined', (userId, userName) => {
            console.log(`user ${userName} (${userId}) joined`);
            setUsersInfo(state => [
                ...state,
                {id: userId, name: userName, signed: true}
            ]);
            createPeerConnection(userId)
             .then(() => {
                console.log(`send offer to ${userId}`);
                sendOffer(userId);
             })
             .catch(error => {
                console.log("Error: couldn't create peer connection\n", error);
             });
        });
        
        client.on('user-left', userId => {
            console.log(`user ${userId} left`);
            setUsersInfo(state => {
                // const index = state.indexOf(user => (user.id === userId));
                return state.filter(user => (user.id !== userId));
            });
        });
        
        client.on('message-from-peer', async (userId, message) => {
            console.log(`member ${userId} sent message`, message);
            switch(message.type) {
                case 'offer':
                    await createPeerConnection(userId);
                    await sendAnswer(userId, message.offer);
                    break;
                case 'answer':
                    await addAnswer(userId, message.answer);
                    break;
                case 'candidate': // when we get an ICE candidate
                    await addIceCandidate(userId, message.candidate);
                    break;
                default:
                    console.log("couldn't understand the message type");
            }
        });
        
        return () => {
            console.log('disconnect from the server');
            client.disconnect();
            
            console.log('removing tracks');
            localStream.getTracks().forEach(track => {
                track.stop();
            });
            usersPeerMap.forEach(user => {
                user.stream.getTracks().forEach(track => {
                    track.stop();
                });
            })
        }
    }, []);
    
    const usersButtons = usersInfo.map((info, index) => {
        const signButton = (
            <button style={{color: info.signed ? 'green' : 'red', background: 'none', border: 'none'}}>
                ⬤
            </button>
        );
        
        return (
            <SideButton key={'userB_'+index} start={signButton}>
                <p>{info.name}</p>
            </SideButton>
        );
    });
    
    const soundButtons = soundInfo.map((info, index) => (
        <SideButton key={'soundB_'+index}>
            <p>{info.name}</p>
        </SideButton>
    ));
    
    return (
        <div className={classes.communication}>
            {/* side area */}
            <div className={classes.sideArea}>
                <SidePanel title='users' size={4}>
                    {usersButtons}
                </SidePanel>
                <SidePanel title='sound' size={4}>
                    {soundButtons}
                </SidePanel>
            </div>
            
            {/* main area */}
            <div className={classes.mainArea}>
                <div className={classes.infoPanel}>
                    <h1>some info during the running...</h1>
                </div>
                <div className={classes.controlPanel}>
                    <button>(test) speak to everyone</button>
                    <button>speak to the selected group</button>
                </div>
            </div>
            
        </div>
    );
};

export default Communication;