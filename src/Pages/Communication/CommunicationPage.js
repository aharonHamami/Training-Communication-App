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
    signalingServer: {
        url: "http://"+window.location.hostname+":3005",
        token: ''
    },
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

let client;
let urlList;

const Communication = () => {
    const [usersInfo, setUsersInfo] = useState([]); // [{id: 123, name: 'hello', signed: false}]
    const [soundsInfoList, setSoundsInfoList] = useState(null); // [{name: 'name', soundName: 'sound.mp3', audio: audioObj, play: false}]
    const [micEnabled, setMicEnabled] = useState(DEFAULT_MIC_ENABLE);
    const [recEnabled, setRecEnabled] = useState(false);
    const [recordUrl, setRecordUrl] = useState(null);
    const [error, setError] = useState(null);
    
    const authState = useSelector(state => state.auth);
    
    function updateSound(index, info) {
        setSoundsInfoList(state => {
            const newSoundsInfo = [...state];
            newSoundsInfo[index] = {...newSoundsInfo[index], ...info};
            return newSoundsInfo;
        });
    }
    
    // to start communication
    useEffect(() => {
        if(!authState.userId || !authState.token) {
            return;
        }
        
        urlList = [];
        
        servers.signalingServer.token = authState.token;
        console.log('token: ', authState.token);
        client = new RtcClient(servers);
        
        const myUserInfo = {
            id: authState.userId,
            name: authState.name,
            signed: true
        };
        // setUsersInfo(state => [
        //     {...myUserInfo, name: myUserInfo.name+' (you)'},
        //     ...state
        // ]);
        setUsersInfo([{...myUserInfo, name: myUserInfo.name+' (you)'}]);
        
        // accessing audio in the page:
        if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({video: false, audio: true})
                .then(stream => {
                    setError(null);
                    
                    localStream = stream;
                    
                    localStream.getAudioTracks().forEach(track => {
                        track.enabled = DEFAULT_MIC_ENABLE;
                    });
                    
                    audioContext = new AudioContext();
                    
                    // local stream destination:
                    localStreamDest = audioContext.createMediaStreamDestination();
                    audioContext.createMediaStreamSource(stream).connect(localStreamDest);
                    
                    // record destination:
                    recordStreamDest = audioContext.createMediaStreamDestination();
                    audioContext.createMediaStreamSource(localStreamDest.stream).connect(recordStreamDest);
                    
                    if(authState.admin) {
                        // noise sound effects destination:
                        noiseStreamtDest = audioContext.createMediaStreamDestination();
                        audioContext.createMediaStreamSource(noiseStreamtDest.stream).connect(localStreamDest);
                        // to hear the self noise
                        const noiseAudio = new Audio();
                        noiseAudio.volume = 0.5;
                        noiseAudio.srcObject = noiseStreamtDest.stream;
                        noiseAudio.play();
                        
                        // // osscillator: delete later
                        // const oscillator = audioContext.createOscillator();
                        // // oscillator.type = "square";
                        // // oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // value in hertz
                        // oscillator.connect(noiseStreamtDest);
                        // oscillator.start();
                    }
                    
                    if(!client.isConnected() && myUserInfo.id) {
                        console.log('trying to connect to the server..., info: ', myUserInfo.id);
                        client.connect({
                            userId: myUserInfo.id,
                            userName: myUserInfo.name,
                            roomId: 'main'
                        }, localStreamDest.stream); // stream
                    }
                    
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
        
        if(authState.admin) {
            // getting additional sounds:
            console.log('getting sound list from the server...');
            axiosServer.get('/editing/sounds',
            { headers: {'Authentication': authState.token} }
            ) // sound list
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
                        setSoundsInfoList(newSoundsInfo);
                    }else {
                        console.log("Error: didn't get a proper response from the server");
                    }
                })
                .catch(error => {
                    console.log('Server error: ', error);
                });
        }
        
        return () => {
            client.disconnect();
            
            // disabling my tracks
            localStream.getTracks().forEach(track => {
                track.stop();
            });
            
            // close all streams - including noise audio
            audioContext.close();
            
            // delete blob's urls
            console.log('delete all urls');
            for(const url of urlList) {
                URL.revokeObjectURL(url);
            }
        }
    }, [authState]);
    
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
            URL.revokeObjectURL(recordUrl);
            setRecordUrl(audioURL);
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
    
    async function loadAudio(path) {
        return axiosServer.get(path,
        {responseType: 'arraybuffer', headers: {'Authentication': authState.token}})
            .then(response => {
                const buffer = response.data;
                
                const blob = new Blob([buffer], { type: 'audio/ogg' });
                const url = URL.createObjectURL(blob);
                urlList.push(url);
                // window.open(url);
                console.log('return actual audio');
                const audio = new Audio(url);
                return Promise.resolve(audio);
            })
            .catch(error => {
                console.log('something went wrong: ', error);
                return Promise.reject(error)
            })
    }
    
    const handlePlaySoundPressed = soundIndex => {
        const soundInfo = soundsInfoList[soundIndex];
        
        console.log('play sound: ', !soundInfo.play);
        
        if(soundInfo.audio) {   // if the audio is already saved on the RAM
            if(soundInfo.play) {
                soundInfo.audio.pause();
            }else {
                soundInfo.audio.play();
            }
            updateSound(soundIndex, {play: !soundInfo.play});
        } else {                // if not get it from the server
            console.log('getting sound file from the server...');
            const path = axiosServer.getUri() + '/editing/sounds/' + soundInfo.soundName;
            loadAudio(path)
                .then(soundAudio => {
                    soundAudio.volume = 0.5;
                    soundAudio.crossOrigin = "anonymous"; // preventing error of mutated audio (CORS access restrictions)
                    
                    try {
                        audioContext.createMediaElementSource(soundAudio).connect(noiseStreamtDest);
                    }catch (e) {
                        console.log(e);
                    }
                    
                    soundAudio.play();
                    
                    updateSound(soundIndex, {play: true, audio: soundAudio});
                })
                .catch(error => {
                    console.log("couldn't get audio properly: ", error);
                });
        }
    }
    
    const usersButtons = <UserButtons usersInfo={usersInfo} />
    
    let soundButtons = <CircularProgress />;
    if(soundsInfoList) {
        soundButtons = <SoundButtons soundsInfo={soundsInfoList} onSoundPressed={handlePlaySoundPressed} />;
    }
    
    let recordControls = null;
    if(recordUrl) {
        recordControls = <>
            <audio src={recordUrl} type="audio/ogg" controls />
            <p>download</p>
            <p>upload</p>
        </>;
    }
    
    return <>
        {!authState.userId ? <Navigate to='/log-in' replace/> : null}
        <div className={classes.communication}>
            {/* side area */}
            <div className={classes.sideArea}>
                <SidePanel title='users' size={4}>
                    {usersButtons}
                </SidePanel>
                {
                    authState.admin ?
                    <SidePanel title='sound' size={4}>
                        {soundButtons}
                    </SidePanel>
                    : null
                }
            </div>
            
            {/* main area */}
            <div className={classes.mainArea}>
                <div className={classes.infoPanel}>
                    <h1>some info during the running...</h1>
                    {error ? <h2 style={{color: 'red'}}>{error}</h2> : null}
                </div>
                <div className={classes.controlPanel}>
                    <div style={{display: 'flex', flexDirection: 'row', gap: '20px'}}>
                        <button style={{color: (micEnabled?'green':'red')}} onClick={handleMicPressed}>speak to everyone</button>
                        <button>speak to selected group</button>
                        {
                            !recEnabled ?
                            <button onClick={startRecording}>record conversation</button> : 
                            <button style={{color: 'red'}} onClick={stopRecording}>stop recording</button>
                        }
                    </div>
                    <div style={{display: 'flex', flexDirection: 'row', gap: '20px'}}>
                        {recordControls}
                    </div>
                </div>
            </div>
            
        </div>
    </>;
};

export default Communication;