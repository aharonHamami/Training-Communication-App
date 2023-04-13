import classes from './edit.module.css';

import { CircularProgress } from '@mui/material';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

import Menubar from '../../Components/Menubar/Menubar';
import SidePanel from "../../ComponentsUI/Sidebar/SidePanel";
import RecordButtons from './Buttons/RecordButtons';
import axiosServer from '../../clients/axios/axiosClient';
import AudioControls from '../../Components/AudioControls/AudioControls';
import AudiooWaveform from './UI/AudioWaveform/AudioWaveform';

let audioCtx;
let urlList;

const Edit = () => {
    const [recordsInfo, setRecordsInfo] = useState(null); // [{name: 'name', recordName: 'record.mp3', audio: audioObj, waveform: waveformData}]
    const [recordIndex, setRecordIndex] = useState(-1);
    const [sliderValue, setSliderValue] = useState(0);
    const [maxValue, setMaxValue] = useState(100);
    
    const authState = useSelector(state => state.auth);
    
    // to avoid problems and ensure this object is never changed due to React's re-renders
    const currentAudioRef = useRef(null);
    const fftRef = useRef(null);
    const menuInfoRef = useRef([
        {
            label: "File",
            options: [
                {
                    title: 'import file',
                    action: null
                },
                {
                    title: 'upload files',
                    action: () => {
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
                            
                            // sending the files as form data
                            axiosServer.post('/editing/records/upload-files', formData, { headers: {'Authentication': authState.token} } /*{onUploadProgress: }*/)
                                .then(response => {
                                    console.log('server response: ', response);
                                    
                                    const newRecordNames = response.data.files.map(file => file.name);
                                    addNewRecords(newRecordNames);
                                })
                                .catch(error => {
                                    console.log("Couldn't send the files: ", error);
                                });
                        }
                        
                        input.click(); // to emit the onchange event
                    }
                },
            ]
        },
        {
            label: "View",
            options: [
                {
                    title: 'dark/light mode',
                    action: null
                }
            ]
        },
        {
            label: "Help",
            options: [
                {
                    title: 'how to use?',
                    action: null
                },
                {
                    title: 'about me',
                    action: null
                },
                {
                    title: 'open source',
                    action: () => {
                        window.open('https://github.com/aharonHamami/Training-Communication-App');
                    }
                }
            ]
        }
    ]);
    
    const addNewRecords = useCallback((recordNames) => {
        const newRecordsInfo = recordNames.map(record => ({
            name: record,
            recordName: record,
            audio: null,
            waveform: null
        }));
        setRecordsInfo(state => {
            if(!state || !Array.isArray(state)) { // in case these are the first sounds
                return newRecordsInfo
            }
            return [...state, ...newRecordsInfo];
        });
    }, [setRecordsInfo]);
    
    const updateRecord = useCallback((index, info) => {
        setRecordsInfo(state => {
            const newRecordsInfo = [...state];
            newRecordsInfo[index] = {...newRecordsInfo[index], ...info};
            return newRecordsInfo;
        });
    }, [setRecordsInfo]);
    
    // get the records from the server
    useEffect(() => {
        if(!authState || !authState.admin) {
            return;
        }
        
        urlList = [];
        
        console.log('getting recordings from the server...');
        axiosServer.get('/editing/records',
        {headers: {'Authentication': authState.token}})
            .then(response => {
                console.log('server response (records): ', response);
                
                const recordsList = response.data.recordNames;
                if(Array.isArray(recordsList)) {
                    addNewRecords(recordsList);
                }else {
                    console.log("Error: didn't get a proper response from the server");
                }
            })
            .catch(error => {
                console.log("Error: couldn't get record names from server: \n", error);
            });
        
        return () => {
            console.log('delete all urls');
            for(const url of urlList) {
                URL.revokeObjectURL(url);
            }
        }
    }, [authState, addNewRecords]);
    
    // handle the audio selected
    useEffect(() => {
        if(recordIndex >= 0 && recordsInfo[recordIndex].audio) {
            const currentRecordInfo = recordsInfo[recordIndex];
            currentAudioRef.current = currentRecordInfo.audio;
            
            currentAudioRef.current.onloadedmetadata = () => {
                console.log('duration: ', currentAudioRef.current.duration);
                setMaxValue(currentAudioRef.current.duration);
            }
            
            currentAudioRef.current.ontimeupdate = () => {
                setSliderValue(currentAudioRef.current.currentTime);
            }
        }
    }, [recordsInfo, recordIndex]);
    
    const loadAudio = useCallback((path, index) => {
        axiosServer.get(path,
        {responseType: 'arraybuffer', headers: {'Authentication': authState.token}})
            .then(response => {
                const buffer = response.data;
                
                if(!audioCtx) {
                    // to solve chrome problem of amking an audioContext before user interaction
                    audioCtx = new AudioContext();
                }
                
                const blob = new Blob([buffer], { type: 'audio/ogg' });
                const url = URL.createObjectURL(blob);
                urlList.push(url);
                // window.open(url);
                const recordAudio = new Audio(url);
                updateRecord(index, {audio: recordAudio});
                
                // need to be called before making a blob from the arraBuffer
                audioCtx.decodeAudioData(buffer, audioBuffer => {
                    const channelData = audioBuffer.getChannelData(0);
                    // console.log('channel data: ', channelData);
                    updateRecord(index, {waveform: channelData});
                },
                e => {
                    console.log('Error decoding audio data', e);
                });
            })
            .catch(error => {
                console.log("couldn't get audio properly: ", error);
            })
    }, [authState.token, updateRecord]);
    
    const handleRecordPressed = useCallback((records, index) => {
        const recordInfo = records[index];
        console.log('record pressed: ', recordInfo.name);
        
        if(currentAudioRef.current) {
            currentAudioRef.current.pause();
        }
        
        if(recordInfo.audio) {
            setRecordIndex(index);
            setMaxValue(recordInfo.audio.duration);
            setSliderValue(recordInfo.audio.currentTime);
        }else {
            console.log('getting record from the server...');
            const path = '/editing/records/' + recordInfo.recordName;
            
            // delete one of them:
            loadAudio(path, index);
            setRecordIndex(index);
            setSliderValue(0);
        }
        
    }, [loadAudio]);
    
    const handleFftPressed = useCallback((records, index) => {
        console.log('calculate FFT');
        const waveform = records[index].waveform;
        
        axiosServer.post('/editing/edit/calculateFFT', {signal: waveform},
        {headers: {'Authentication': authState.token}})
            .then(response => {
                fftRef.current = response.data.FFT;
                
                console.log('server response: ', response.data);
                let fftWaveform = response.data.FFT.map(cmplxNum => Math.sqrt(cmplxNum.re**2 + cmplxNum.im**2));
                // fftWaveform = fftWaveform.slice(0, fftWaveform.length/2);
                // fftWaveform = fftWaveform.slice(fftWaveform.length/10, fftWaveform.length - fftWaveform.length/10);
                const max = fftWaveform.reduce((max, currentValue) => Math.max(max, currentValue));
                fftWaveform = fftWaveform.map(val => val/max);
                
                updateRecord(index, {waveform: fftWaveform});
            })
            .catch(error => {
                console.log("Couldn't get dtf info from the server:\n", error);
            });
    }, [authState.token, updateRecord]);;
    
    const handleIfftPressed = useCallback((index) => {
        console.log('calculate IFFT');
        axiosServer.post('/editing/edit/calculateIFFT', {frequencies: fftRef.current},
        {headers: {'Authentication': authState.token}})
            .then(response => {
                console.log('server response: ', response.data);
                let signal = response.data.IDFT.map(cmplxNum => cmplxNum.re);
                
                // playing the signal
                const myArrayBuffer = audioCtx.createBuffer(1, signal.length, audioCtx.sampleRate);
                // myArrayBuffer.copyFromChannel(new Float32Array(signal), 0);
                const nowBuffering = myArrayBuffer.getChannelData(0);
                for (let i = 0; i < myArrayBuffer.length; i++) {
                    nowBuffering[i] = signal[i];
                }
                const source = audioCtx.createBufferSource();
                source.buffer = myArrayBuffer;
                source.connect(audioCtx.destination);
                console.log('start playing...');
                source.start();
                
                updateRecord(index, {waveform: signal});
            })
            .catch(error => {
                console.log("Couldn't get dtf info from the server:\n", error);
            });
    }, [authState.token, updateRecord]);
    
    const handleReduceNoise = useCallback((records, index) => {
        console.log('reduce noise');
        const waveform = records[index].waveform;
        
        axiosServer.post('/editing/edit/removeNoise',
            {
                signal: waveform,
                speachDomain: {start: 0, size: waveform.length},
                noiseDomain: {start: 0, size: 2**10} // noise needs to be a power of 2
            },
            {headers: {'Authentication': authState.token}})
            .then(response => {
                console.log('server response: ', response.data);
                
                let signal = response.data.signal.map(sample => {
                    if(typeof sample === 'number') return sample;
                    return sample.re
                });
                
                // playing the signal:
                const myArrayBuffer = audioCtx.createBuffer(1, signal.length, audioCtx.sampleRate);
                // myArrayBuffer.copyFromChannel(new Float32Array(signal), 0);
                const nowBuffering = myArrayBuffer.getChannelData(0);
                for (let i = 0; i < myArrayBuffer.length; i++) {
                    nowBuffering[i] = signal[i];
                }
                const source = audioCtx.createBufferSource();
                source.buffer = myArrayBuffer;
                source.connect(audioCtx.destination);
                console.log('start playing...');
                source.start();
                
                updateRecord(index, {waveform: signal});
            })
            .catch(error => {
                console.log("Error: couldn't remove noise:\n", error);
            });
    }, [authState.token, updateRecord]);
    
    let recordButtons = <CircularProgress />;
    if(recordsInfo) {
        recordButtons = <RecordButtons recordsInfo={recordsInfo} 
                                    onPress={(index) => (handleRecordPressed(recordsInfo, index))} />;
    }
    
    let content = <h3>Choose a file</h3>
    if(recordIndex >= 0) {
        content = <>
            <h1>Audio Explorer</h1>
            
            <div className={classes.infoPanel}>
                <button onClick={() => {handleFftPressed(recordsInfo, recordIndex)}}>calculate fft</button>
                <button onClick={() => {handleIfftPressed(recordIndex)}}>calculate ifft</button>
                <AudiooWaveform audio={recordsInfo[recordIndex]} />
                <button onClick={() => {handleReduceNoise(recordsInfo, recordIndex)}}>reduce noise</button>
            </div>
            
            <AudioControls 
                audioRef={currentAudioRef}
                value={sliderValue}
                duration={maxValue}
                 />
                
            <h2>{recordsInfo[recordIndex].name}</h2>
            
        </>;
    }
    
    return <>
        {!authState.admin ? <Navigate to='/' replace/> : null}
        <div className={classes.editPage}>
            <Menubar itemsInfo={menuInfoRef.current} />
            <div className={classes.content}>
                {/* side window */}
                <div className={classes.sideArea}>
                    {/* loaded audio */}
                    <SidePanel title='audio' size={1}>
                        {recordButtons}
                    </SidePanel>
                </div>
                
                {/* main window */}
                <div className={classes.mainArea}>{content}</div>
            </div>
        </div>
    </>;
}

export default Edit;