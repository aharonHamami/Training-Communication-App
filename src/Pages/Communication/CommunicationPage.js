import classes from './communication.module.css';

import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { RtcClient } from '../../clients/WebRtcClient/webrtcClient';

import SidePanel from '../../ComponentsUI/Sidebar/SidePanel';
import SideButton from '../../ComponentsUI/Sidebar/SideButton/SideButton';

const servers = {
    signalingServer: "http://"+window.location.hostname+":3005",
    webRtcServers: {
        iceServers: [
            {
                urls: ['stun:stun1.l.google.com:19302', 'stun:stun1.l.google.com:19302']
            }
        ]
    }
};

let localStream;
let audioContext; // for mixing streams
let contextDest;
let mediaRecorder;

const client = new RtcClient(servers);

const Communication = () => {
    const [usersInfo, setUsersInfo] = useState([]); // [{id: 123, name: 'hello', signed: false}]
    const [soundInfo] = useState([
        {name: 'sound1.png'},
        {name: 'sound2.png'},
        {name: 'sound3.png'},
        {name: 'sound4.png'}
    ]);
    const [micEnabled, setMicEnabled] = useState(false);
    const [recEnabled, setRecEnabled] = useState(false);
    const [availableUrl, setAvailableUrl] = useState(null);
    const [error, setError] = useState(null);
    
    const authState = useSelector(state => state.auth);
    
    useEffect(() => {
        if(!authState.userId) {
            return;
        }
        
        const myUserInfo = {
            id: authState.userId,
            name: authState.name,
            signed: true
        };
        setUsersInfo(state => [
            {...myUserInfo, name: myUserInfo.name+' (you)'},
            ...state
        ]);
        
        if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({video: false, audio: true})
                .then(stream => {
                    localStream = stream;
                    
                    audioContext = new AudioContext();
                    contextDest = audioContext.createMediaStreamDestination();
                    // console.log('merge local stream');
                    audioContext.createMediaStreamSource(stream).connect(contextDest);
                    
                    console.log('trying to connect to the server...');
                    client.connect({
                        userId: myUserInfo.id,
                        userName: myUserInfo.name,
                        roomId: 'main'
                    }, stream);
                    
                    client.on('new-users', handleNewUsers);
                    client.on('stream', handleNewStream);
                    client.on('user-left', handleUserLeft);
                })
                .catch(error => {
                    console.log("error: couldn't get access to user media\n", error);
                    setError("error: couldn't get access to user media");
                });
        } else {
            setError('Error: media is not supported');
        }
        
        return () => {
            client.disconnect();
            
            // disabling my tracks
            localStream.getTracks().forEach(track => {
                track.stop();
            });
        }
    }, [authState]);
    
    function handleNewUsers(users) {
        const usersArray = users.map(user => ({
            id: user.id,
            name: user.name,
            signed: true
        }));
        
        setUsersInfo(state => [
            ...state,
            ...usersArray
        ]);
    }
    
    function handleNewStream(stream, userId) {
        if(audioContext && contextDest) {
            // connect the current stream into the audio context
            // console.log('merge stream: ', stream.getTracks());
            try {
                audioContext.createMediaStreamSource(stream).connect(contextDest);
            }catch(e) {
                console.log('Audiocontext Error: ', e);
            }
        }else {
            console.log('<< Error: audioContext or destination is still not ready >>');
        }
        
        // play his stream:
        const audio = new Audio();
        audio.srcObject = stream;
        audio.play();
    }
    
    function handleUserLeft(userId) {
        console.log(`user ${userId} left`);
        setUsersInfo(state => {
            return state.filter(user => (user.id !== userId));
        });
    }
    
    const handleMicPressed = () => {
        setMicEnabled(!micEnabled);
    }
    
    // not supported yet
    const handleRecordPressed = () => {
        const mixedTracks = contextDest.stream.getTracks()[0];
        const stream = new MediaStream([mixedTracks]);
        mediaRecorder = new MediaRecorder(stream);
        
        let chunks = []; // saves the data from the recorder
        console.log('start recording');
        mediaRecorder.start();
        setRecEnabled(true);
        console.log('state: ' + mediaRecorder.state);
        
        mediaRecorder.ondataavailable = (e) => {
            console.log('data available');
            chunks.push(e.data); // add data from the recorder to the chunks
        };
        
        mediaRecorder.onstop = (e) => {
            console.log('recording stopped, chunks: ', chunks);
            const blob = new Blob(chunks, {type: "audio/ogg; codecs=opus"}); // blob is a file type?
            chunks = []; // initialing the chunks again
            const audioURL = URL.createObjectURL(blob); // converting blob into URL
            setAvailableUrl(audioURL);
        }
    }
    const stopRecording = () => {
        if(mediaRecorder) {
            mediaRecorder.stop();
            setRecEnabled(false);
            console.log('state: ' + mediaRecorder.state);
        }
    }
    
    // setting the microphone to muted until the user clicks to speak to everyone
    if(localStream) {
        localStream.getAudioTracks().forEach(track => {
            track.enabled = micEnabled;
        });
    }
    
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
    
    return <>
        {!authState.userId ? <Navigate to='/log-in' replace/> : null}
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
                    {availableUrl ? <audio src={availableUrl} type="audio/ogg" controls /> : null}
                    {error ? <h2 style={{color: 'red'}}>{error}</h2> : null}
                </div>
                <div className={classes.controlPanel}>
                    <button style={{color: (micEnabled?'green':'red')}} onClick={handleMicPressed}>speak to everyone</button>
                    <button>speak to selected group</button>
                    {
                        !recEnabled ?
                        <button onClick={handleRecordPressed}>record conversation</button> : 
                        <button style={{color: 'red'}} onClick={stopRecording}>stop recording</button>
                    }
                </div>
            </div>
            
        </div>
    </>;
};

export default Communication;