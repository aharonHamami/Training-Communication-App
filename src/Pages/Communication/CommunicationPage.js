import classes from './communication.module.css';

import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import CircularProgress from '@mui/material/CircularProgress';

import RtcClient from '../../clients/WebRtcClient/webrtcClient';
import axiosServer from '../../clients/axios/axiosClient';
import SidePanel from '../../ComponentsUI/Sidebar/SidePanel';
import UserButtons from './Buttons/UserButtons';
import SoundButtons from './Buttons/SoundButtons';

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

const DEFAULT_MIC_ENABLE = false;

let audioContext; // for mixing streams
// context destinations:
let noiseStreamtDest;   // for audio context - noise effects
let localStreamDest;   // for audio context - noise effects + localStream
let recordStreamDest;  // for audio context - noise effects + localStream + members stream

let localStream;
let mediaRecorder;

const client = new RtcClient(servers);

const Communication = () => {
    const [usersInfo, setUsersInfo] = useState([]); // [{id: 123, name: 'hello', signed: false}]
    const [soundsInfo, setSoundsInfo] = useState(null); // [{name: 'name', soundName: 'sound.mp3', audio: audioObj, play: false}]
    const [micEnabled, setMicEnabled] = useState(DEFAULT_MIC_ENABLE);
    const [recEnabled, setRecEnabled] = useState(false);
    const [availableUrl, setAvailableUrl] = useState(null);
    const [error, setError] = useState(null);
    
    const authState = useSelector(state => state.auth);
    
    // to start communication
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
                    setError(null);
                    
                    localStream = stream;
                    
                    localStream.getAudioTracks().forEach(track => {
                        track.enabled = DEFAULT_MIC_ENABLE;
                    });
                    
                    audioContext = new AudioContext();
                    
                    // noise sound effects destination:
                    noiseStreamtDest = audioContext.createMediaStreamDestination();
                    // to hear the self noise
                    const noiseAudio = new Audio();
                    noiseAudio.srcObject = noiseStreamtDest.stream;
                    noiseAudio.play();
                    
                    // // osscillator: delete later
                    // const oscillator = audioContext.createOscillator();
                    // // oscillator.type = "square";
                    // // oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // value in hertz
                    // oscillator.connect(noiseStreamtDest);
                    // oscillator.start();
                    
                    // local stream destination:
                    localStreamDest = audioContext.createMediaStreamDestination();
                    audioContext.createMediaStreamSource(stream).connect(localStreamDest);
                    audioContext.createMediaStreamSource(noiseStreamtDest.stream).connect(localStreamDest);
                    
                    // record destination:
                    recordStreamDest = audioContext.createMediaStreamDestination();
                    audioContext.createMediaStreamSource(localStreamDest.stream).connect(recordStreamDest);
                    
                    console.log('trying to connect to the server...');
                    client.connect({
                        userId: myUserInfo.id,
                        userName: myUserInfo.name,
                        roomId: 'main'
                    }, localStreamDest.stream); // stream
                    
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
            
            // close all streams - including noise audio
            audioContext.close();
        }
    }, [authState]);
    
    // to get additional sounds
    useEffect(() => {
        console.log('getting sound list from the server...');
        axiosServer.get('/editing/sounds') // sound list
            .then(response => {
                console.log('server response (sound): ', response);
                
                const soundsList = response.data.soundNames;
                if(Array.isArray(soundsList)) {
                    const newSoundsInfo = soundsList.map(sound => ({
                        name: sound,
                        soundName: sound,
                        audio: null,
                        play: false,
                    }));
                    setSoundsInfo(newSoundsInfo);
                }else {
                    console.log("Error: didn't get a proper response from the server");
                }
            })
            .catch(error => {
                console.log('Server error: ', error);
            });
    }, []);
    
    // handle microphone
    useEffect(() => {
        if(localStream) {
            localStream.getAudioTracks().forEach(track => {
                track.enabled = micEnabled;
            });
        }
    }, [micEnabled]);
    
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
        if(audioContext && recordStreamDest) {
            // connect the current stream into the audio context
            try {
                audioContext.createMediaStreamSource(stream).connect(recordStreamDest);
            }catch(e) {
                console.log('Audiocontext Error: ', e);
            }
        }else {
            console.log('<< Error: audioContext or destination is still not ready >>');
        }
        
        // play the other member stream:
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
    const startRecording = () => {
        const mixedTracks = recordStreamDest.stream.getTracks()[0];
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
            const blob = new Blob(chunks, {type: "audio/ogg; codecs=opus"}); // blob is a file type? // audio/mpeg
            chunks = []; // initialing the chunks again
            const audioURL = URL.createObjectURL(blob); // converting blob into URL
            // console.log('record url: ', audioURL);
            setAvailableUrl(audioURL);
            // window.open(audioURL);
        }
    }
    const stopRecording = () => {
        if(mediaRecorder) {
            mediaRecorder.stop();
            setRecEnabled(false);
            console.log('state: ' + mediaRecorder.state);
        }
    }
    
    const playSound = soundInfo => {
        console.log('play sound');
        
        // updating the 'play' field
        const newSoundsInfo = [...soundsInfo];
        const soundIndex = newSoundsInfo.findIndex(info => (info.soundName === soundInfo.soundName));
        newSoundsInfo[soundIndex] = {
            ...newSoundsInfo[soundIndex],
            play: true
        }
        
        if(soundInfo.audio) {   // if the audio is already saved on the RAM
            soundInfo.audio.play();
        } else {                // if not get it from the server
            console.log('getting sound file from the server...');
            const path = axiosServer.getUri() + '/editing/sounds/' + soundInfo.soundName;
            const soundAudio = new Audio(path);
            soundAudio.volume = 0.5;
            soundAudio.crossOrigin = "anonymous"; // preventing error of mutated audio (CORS access restrictions)
            
            try {
                audioContext.createMediaElementSource(soundAudio).connect(noiseStreamtDest);
            }catch (e) {
                console.log(e);
            }
            
            soundAudio.play();
            
            newSoundsInfo[soundIndex] = {
                ...newSoundsInfo[soundIndex],
                audio: soundAudio
            }
        }
        
        setSoundsInfo(newSoundsInfo);
    }
    const stopSound = soundInfo => {
        console.log('stop sound');
        
        const audio = soundInfo.audio;
        if(audio) {
            audio.pause();
            
            // updating the 'play' field
            const newSoundsInfo = [...soundsInfo];
            const soundIndex = newSoundsInfo.findIndex(info => (info.soundName === soundInfo.soundName));
            newSoundsInfo[soundIndex] = {
                ...newSoundsInfo[soundIndex],
                play: false
            }
            setSoundsInfo(newSoundsInfo);
        }
    }
    
    const usersButtons = <UserButtons usersInfo={usersInfo} />
    
    let soundButtons = <CircularProgress />;
    if(soundsInfo) {
        soundButtons = <SoundButtons soundsInfo={soundsInfo} play={playSound} stop={stopSound} />;
    }
    
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
                        <button onClick={startRecording}>record conversation</button> : 
                        <button style={{color: 'red'}} onClick={stopRecording}>stop recording</button>
                    }
                </div>
            </div>
            
        </div>
    </>;
};

export default Communication;