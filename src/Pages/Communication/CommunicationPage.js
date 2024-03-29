import classes from './communication.module.css';

import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { CircularProgress, IconButton } from '@mui/material';
import { Mic, RadioButtonChecked, Download, Upload, CheckCircle } from '@mui/icons-material';
import fixWebmDuration from "fix-webm-duration";

import RtcClient from '../../clients/WebRtcClient/webrtcClient';
import axiosServer from '../../clients/axios/axiosClient';
import SidePanel from '../../ComponentsUI/Sidebar/SidePanel';
import UserButtons from './Buttons/UserButtons';
import SoundButtons from './Buttons/SoundButtons';
import { useNotify } from '../../ComponentsUI/Modals/Notification/Notification';

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
let noiseStreamDest;   // for audio context - noise effects
let localStreamDest;   // for audio context - noise effects + localStream
let recordStreamDest;  // for audio context - noise effects + localStream + members stream

let localStream;
let mediaRecorder;

let client;
let urlList;

const Communication = () => {
    const [usersInfo, setUsersInfo] = useState(null); // [{id: 123, name: 'hello', signed: false}]
    const [soundsInfo, setSoundsInfo] = useState(null); // [{name: 'name', soundName: 'sound.mp3', audio: audioObj, play: false}]
    const [micEnabled, setMicEnabled] = useState(DEFAULT_MIC_ENABLE);
    const [recEnabled, setRecEnabled] = useState(false);
    const [recordUrl, setRecordUrl] = useState(null);
    const [recordSent, setRecordSent] = useState(false);
    const [error, setError] = useState(null);
    const [messages, setMessages] = useState([]);
    
    const authState = useSelector(state => state.auth);
    const notify = useNotify();
    
    const updateSound = useCallback((index, info) => {
        setSoundsInfo(state => {
            const newSoundsInfo = [...state];
            newSoundsInfo[index] = {...newSoundsInfo[index], ...info};
            return newSoundsInfo;
        });
    }, []);
    
    const addNewSounds = useCallback((soundNames) => {
        const newSoundsInfo = soundNames.map(sound => ({
            name: sound,
            soundName: sound,
            audio: null,
            play: false,
        }));
        setSoundsInfo(state => {
            if(!Array.isArray(state)) { // in case these are the first sounds
                return newSoundsInfo
            }
            return [...state, ...newSoundsInfo];
        });
    }, []);
    
    // to start communication
    useEffect(() => {
        let unMounted = false;
        
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
        
        // accessing audio in the page:
        if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({video: false, audio: true})
                .then(stream => {
                    if(unMounted){
                        stream.getTracks().forEach(track => {
                            track.stop();
                        });
                        return;
                    }
                    
                    setError(null);
                    
                    localStream = stream;
                    
                    localStream.getAudioTracks().forEach(track => {
                        track.enabled = DEFAULT_MIC_ENABLE;
                    });
                    
                    audioContext = new AudioContext();
                    
                    if(authState.admin) {
                        // << Error im FireFox - can not merge with local stream >>
                        noiseStreamDest = audioContext.createMediaStreamDestination();
                        // to hear the self noise
                        const noiseAudio = new Audio();
                        noiseAudio.volume = 0.25;
                        noiseAudio.srcObject = noiseStreamDest.stream;
                        noiseAudio.play();
                    }
                    
                    // local stream destination:
                    localStreamDest = audioContext.createMediaStreamDestination();
                    audioContext.createMediaStreamSource(stream).connect(localStreamDest);
                    if(authState.admin) {
                        audioContext.createMediaStreamSource(noiseStreamDest.stream).connect(localStreamDest);
                    }
                    
                    // record destination:
                    recordStreamDest = audioContext.createMediaStreamDestination();
                    audioContext.createMediaStreamSource(localStreamDest.stream).connect(recordStreamDest);
                    
                    // // osscillator: delete later
                    // const oscillator = audioContext.createOscillator();
                    // // oscillator.type = "square";
                    // // oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // value in hertz
                    // const gainNode = audioContext.createGain();
                    // oscillator.connect(gainNode);
                    // gainNode.gain.volume = 0.1;
                    // gainNode.connect(noiseStreamtDest);
                    // oscillator.start();
                    
                    if(!client.isConnected() && myUserInfo.id) {
                        console.log('trying to connect to the server..., info: ', myUserInfo.id);
                        client.connect({
                            userId: myUserInfo.id,
                            userName: myUserInfo.name,
                            roomId: 'main'
                        }, localStreamDest.stream); // stream
                    }
                    
                    function handleClientConnected(users) {
                        const myUser = {...myUserInfo, name: myUserInfo.name+' (you)'};
                        
                        const usersArray = users.map(user => ({
                            id: user.id,
                            name: user.name,
                            signed: true
                        }));
                        
                        setUsersInfo(state => {
                            return [ myUser, ...usersArray ];
                        });
                        
                        const newMessages = users.map(user => `${user.name} is inside the channel`);
                        setMessages(state => [
                            ...state,
                            ...newMessages
                        ]);
                    }
                    
                    function handleNewUsers(users){
                        const usersArray = users.map(user => ({
                            id: user.id,
                            name: user.name,
                            signed: true
                        }));
                        
                        setUsersInfo(state => {
                            if(!Array.isArray(state)) {
                                return usersArray;
                            }
                            return [ ...state, ...usersArray ];
                        });
                        
                        const newMessages = users.map(user => `${user.name} joined the channel`);
                        setMessages(state => [
                            ...state,
                            ...newMessages
                        ]);
                    };
                    
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
                    };
                    
                    function handleUserLeft(userId) {
                        console.log(`user ${userId} left`);
                        let userName = '';
                        
                        setUsersInfo(state => {
                            return state.filter(user => {
                                if(user.id !== userId) {
                                    return true;
                                }
                                userName = user.name;
                                return false;
                            });
                        });
                        
                        setMessages(state => [
                            ...state,
                            `${userName} left`
                        ]);
                    };
                    
                    client.on('connected', handleClientConnected);
                    client.on('new-users', handleNewUsers);
                    client.on('stream', handleNewStream);
                    client.on('user-left', handleUserLeft);
                })
                .catch(error => {
                    console.log("error: couldn't get access to user media\n", error);
                    console.log(error);
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
                        setSoundsInfo(newSoundsInfo);
                    }else {
                        console.log("Error: didn't get a proper response from the server");
                    }
                })
                .catch(error => {
                    console.error('Server error: ', error);
                    if(error.response.status !== 401){ // if this is not due to lack of authentication
                        notify("Error: couldn't get the audio from the server", 'error');
                    }
                });
        }
        
        return () => {
            unMounted = true;
            
            if(client) {
                client.disconnect();
            }
            
            // disabling my tracks
            if(localStream) {
                console.log('closing local stream');
                localStream.getTracks().forEach(track => {
                    track.stop();
                });
            }
            
            // close all streams - including noise audio
            if(audioContext) {
                audioContext.close();
            }
            
            // delete blob's urls
            console.log('delete all urls');
            for(const url of urlList) {
                URL.revokeObjectURL(url);
            }
        }
    // ignore warning
    // eslint-disable-next-line
    }, [authState]);
    
    // handle microphone
    useEffect(() => {
        if(localStream) {
            localStream.getAudioTracks().forEach(track => {
                track.enabled = micEnabled;
            });
        }
    }, [micEnabled]);
    
    const handleMicPressed = useCallback(() => {
        setMicEnabled(state => !state);
    }, []);
    
    const handleRecordPressed = useCallback(() => {
        console.log('record pressed: '+recEnabled);
        if(!recEnabled) { // start recording
            const mixedTracks = recordStreamDest.stream.getTracks()[0];
            const stream = new MediaStream([mixedTracks]);
            mediaRecorder = new MediaRecorder(stream);
            let startRecordTime;
            
            let chunks = []; // saves the data from the recorder
            console.log('start recording');
            mediaRecorder.start();
            startRecordTime = Date.now();
            setRecEnabled(true);
            console.log('state: ' + mediaRecorder.state);
            
            mediaRecorder.ondataavailable = (e) => {
                console.log('data available');
                chunks.push(e.data); // add data from the recorder to the chunks
            };
            
            mediaRecorder.onstop = (e) => {
                const mediaDuration = Date.now() - startRecordTime;
                console.log('recording stopped, chunks: ', chunks);
                const blob = new Blob(chunks, {type: "audio/ogg; codecs=opus"}); // audio/ogg
                chunks = []; // initialing the chunks again
                
                // MediaRecorder doesn't include duration header - this liberary fix that and add that to the blob:
                fixWebmDuration(blob, mediaDuration, (fixedBlob) => {
                    const audioURL = URL.createObjectURL(fixedBlob); // converting blob into URL
                    // console.log('record url: ', audioURL);
                    URL.revokeObjectURL(recordUrl); // delete previous url
                    setRecordUrl(audioURL);
                    // window.open(audioURL);
                });
            }
        }else { // stop recording
            if(mediaRecorder) {
                mediaRecorder.stop();
                setRecEnabled(false);
                console.log('state: ' + mediaRecorder.state);
            }
        }
    }, [recordUrl, recEnabled]);
    
    /**
     * load audio files from the server
     * @param {String} path - path to the server who has the audio
     * @returns a Promise of the audio loaded
     */
    const loadAudio = useCallback(async (path) => {
        return axiosServer.get(path,
        {responseType: 'arraybuffer', headers: {'Authentication': authState.token}})
            .then(response => {
                const buffer = response.data;
                
                const blob = new Blob([buffer], { type: 'audio/ogg' });
                const url = URL.createObjectURL(blob);
                urlList.push(url);
                // window.open(url);
                const audio = new Audio(url);
                return Promise.resolve(audio);
            })
            .catch(error => {
                console.log('something went wrong: ', error);
                return Promise.reject(error)
            })
    }, [authState.token]);
    
    const handlePlaySoundPressed = useCallback((soundsInfoList, soundIndex) => {
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
                    soundAudio.loop = true;
                    soundAudio.crossOrigin = "anonymous"; // preventing error of mutated audio (CORS access restrictions)
                    
                    try {
                        audioContext.createMediaElementSource(soundAudio).connect(noiseStreamDest);
                    }catch (e) {
                        console.error("couldn't connect stream", e);
                    }
                    
                    soundAudio.play();
                    
                    updateSound(soundIndex, {play: true, audio: soundAudio});
                })
                .catch(error => {
                    console.error("couldn't get audio properly: ", error);
                });
        }
    }, [loadAudio, updateSound]);
    
    const handleSoundDelete = useCallback((soundsInfoList, soundIndex) => {
        const soundInfo = soundsInfoList[soundIndex];
        const name = soundInfo.name;
        
        if(window.confirm(`Are you sure you want to delete ${name}?`)) {
            console.log('delete record: ', name);
            
            axiosServer.delete('/editing/sounds/'+name, {headers: {'Authentication': authState.token}})
                .then(response => {
                    console.log('Server response: \n', response);
                    
                    setSoundsInfo(state => {
                        const newArray = [...state];
                        newArray.splice(soundIndex, 1);
                        return newArray;
                    });
                })
                .catch(error => {
                    console.error("couldn't delete the sound", error);
                    notify("Error: couldn't delete the sound", 'error');
                });
        }
            
    // ignore warning
    // eslint-disable-next-line
    }, [authState.token]);
    
    const handleUploadRecord = useCallback(async (event) => {
        setRecordSent(true);
        
        let file = await fetch(recordUrl)
                            .then(r => r.blob())
                            .then(blobFile => new File([blobFile], `record_${Date.now()}.ogg`, { type: "audio/ogg" }));
        
        // we parse the files into a FormData format:
        const formData = new FormData();
        formData.append('audio', file);
        
        console.log('sending...');
        // sending the files as form data
        axiosServer.post('/editing/records/upload-files', formData, { headers: {'Authentication': authState.token} } /*{onUploadProgress: }*/)
            .then(response => {
                console.log('server response: ', response);
                notify('Your record uploaded successfully', 'success');
            })
            .catch(error => {
                console.error("Couldn't upload the file: ", error);
                setRecordSent(false);
                notify("Couldn't upload the file", 'error');
            });
    // ignore the warning
    // eslint-disable-next-line
    }, [authState.token, recordUrl]);
    
    const handleUploadSound = useCallback(() => {
        var input = document.createElement('input');
        input.type = 'file';
        input.multiple = true; // allow multiple file choices
        
        // waiting for a 'click'
        input.onchange = event => {
            const files = [...event.target.files]; // taking the files
            
            // console.log(files);
            
            // we parse the files into a FormData format:
            const formData = new FormData();
            files.forEach(file => {
                formData.append('audio', file);
            });
            
            console.log('sending:');
            for(const value of formData.values()) {
                console.log(value);
            }
            
            // sending the files as form data // pppp
            axiosServer.post('/editing/sounds/upload-files', formData, { headers: {'Authentication': authState.token} } /*{onUploadProgress: }*/)
                .then(response => {
                    console.log('server response: ', response);
                    
                    const newRecordNames = response.data.files.map(file => file.name);
                    addNewSounds(newRecordNames);
                })
                .catch(error => {
                    console.error("Couldn't send the files: ", error);
                    notify("Error: couldn't upload the noises", 'error');
                });
        }
        
        input.click(); // to emit the onchange event
    // ignore the warning
    // eslint-disable-next-line
    }, [addNewSounds, authState.token]);
    
    
    let usersButtons = <CircularProgress />;
    if(usersInfo) {
        usersButtons = <UserButtons usersInfo={usersInfo} />;
    }
    
    let soundButtons = <CircularProgress />;
    if(soundsInfo) {
        soundButtons = <SoundButtons soundsInfo={soundsInfo}
                                onSoundPressed={(index) => {handlePlaySoundPressed(soundsInfo, index)}}
                                onSoundDelete={(index) => {handleSoundDelete(soundsInfo, index)}} />;
    }
    
    let recordControls = null;
    if(recordUrl) {
        recordControls = <>
            <audio src={recordUrl} type="audio/ogg" controls />
            <a href={recordUrl} download ><Download style={{height: '100%', color: 'blue'}} /></a>
            {
                authState.admin ?
                    !recordSent ?
                    <div onClick={handleUploadRecord} ><Upload style={{height: '100%'}} /></div> :
                    <CheckCircle color='success' style={{height: '100%'}} />
                : null
            }
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
                    <SidePanel title='sound' size={4} titleAction={handleUploadSound}>
                        {soundButtons}
                    </SidePanel>
                    : null
                }
            </div>
            
            {/* main area */}
            <div className={classes.mainArea}>
                <div className={classes.infoPanel}>
                    {error ? <h2 style={{color: 'red'}}>{error}</h2> : null}
                    {messages.map((message, index) => <p key={`message_${index}`}>{message}</p>)}
                </div>
                <div className={classes.controlPanel}>
                    <div className={classes.controlButtons}>
                        <IconButton size='large' onClick={handleMicPressed}>
                            <Mic color={(micEnabled?'success':'error')} fontSize='large'/>
                        </IconButton>
                        {/* <button>speak to selected group</button> */}
                        <IconButton size='large' onClick={handleRecordPressed}>
                            <RadioButtonChecked color={recEnabled ? 'error' : 'none'} fontSize='large'/>
                        </IconButton>
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