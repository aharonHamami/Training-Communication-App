import classes from './edit.module.css';

import { CircularProgress } from '@mui/material';
import { useState, useEffect, useRef } from 'react';

import Menubar from '../../Components/Menubar/Menubar';
import SidePanel from "../../ComponentsUI/Sidebar/SidePanel";
import RecordButtons from './Buttons/RecordButtons';
import axiosServer from '../../clients/axios/axiosClient';
import AudioControls from './UI/AudioControls/AudioControls';
import AudiooWaveform from './UI/AudioWaveform/AudioWaveform';

function isPlaying(audio) {
    if(audio && !audio.paused && audio.currentTime > 0) {
        return true;
    }
    return false;
}

let audioCtx;

let urlList;

const Edit = () => {
    const [recordsInfo, setRecordsInfo] = useState(null); // [{name: 'name', recordName: 'record.mp3', audio: audioObj, waveform: waveformData}]
    const [recordIndex, setRecordIndex] = useState(-1);
    const [sliderValue, setSliderValue] = useState(0);
    const [maxValue, setMaxValue] = useState(100);
    
    // to avoid problems and ensure this object is never changed due to React's re-renders
    const currentAudioRef = useRef(null);
    
    function addNewRecords(recordNames) {
        const newRecordsInfo = recordNames.map(record => ({
            name: record,
            recordName: record,
            audio: null,
            waveform: null
        }));
        setRecordsInfo(state => {
            if(!state || !Array.isArray(state)) {
                return newRecordsInfo
            }
            return [...state, ...newRecordsInfo];
        });
    }
    
    function updateRedord(index, info) {
        setRecordsInfo(state => {
            const newRecordsInfo = [...state];
            newRecordsInfo[index] = {...newRecordsInfo[index], ...info};
            return newRecordsInfo;
        });
    }
    
    // to get the records from the server
    useEffect(() => {
        urlList = [];
        
        console.log('getting recordings from the server...');
        axiosServer.get('/editing/records')
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
    }, []);
    
    // to handle the audio selected
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
    
    function loadAudio(path, index) {
        axiosServer.get(path, {responseType: 'arraybuffer'})
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
                updateRedord(index, {audio: recordAudio});
                
                // need to be called before making a blob from the arraBuffer
                audioCtx.decodeAudioData(buffer, audioBuffer => {
                    const channelData = audioBuffer.getChannelData(0);
                    // console.log('channel data: ', channelData);
                    updateRedord(index, {waveform: channelData});
                },
                e => {
                    console.log('Error decoding audio data', e);
                });
            })
            .catch(error => {
                console.log("couldn't handle response: ", error);
            })
    }
    
    const handleRecordPressed = (index) => {
        const recordInfo = recordsInfo[index];
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
        
    };
    
    const handlePlayPressed = (event) => {
        if(isPlaying(currentAudioRef.current)) {
            currentAudioRef.current.pause();
        }else {
            currentAudioRef.current.play();
        }
    };
    
    const handleFftPressed = index => {
        const waveform = recordsInfo[index].waveform;
        
        // decreasing the signal's length to be a power of 2
        const length = waveform.length;
        let p = 0;
        while(Math.pow(2, p) <= length)
            p++
        p--
        const sendWaveform = waveform.slice(0, Math.pow(2, p));
        console.log('fft size of the sent file is 2^'+p+' which is '+sendWaveform.length+' from '+waveform.length);
        
        // console.log('send to the server: ', {waveform: recordsInfo[index].waveform});
        axiosServer.post('/editing/edit/makeFFT', {waveform: sendWaveform})
            .then(response => {
                console.log('server response: ', response.data);
                let fftWaveform = response.data.FFT.map(cmplxNum => cmplxNum.im);
                const max = fftWaveform.reduce((max, currentValue) => Math.max(max, currentValue));
                fftWaveform = fftWaveform.map(val => val/max);
                updateRedord(index, {waveform: fftWaveform});
            })
            .catch(error => {
                console.log("Couldn't get dtf info from the server:\n", error);
            });
    };
    
    const handleSliderChanged = (value) => {
        currentAudioRef.current.currentTime = value;
        // setSliderValue(value);
    };
    
    let recordButtons = <CircularProgress />;
    if(recordsInfo) {
        recordButtons = <RecordButtons recordsInfo={recordsInfo} onPress={handleRecordPressed} />;
    }
    
    const menuItems = [
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
                        
                        // waiting for a file
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
                            axiosServer.post('/editing/records/upload-files', formData /*{onUploadProgress: }*/)
                                .then(response => {
                                    console.log('server response: ', response);
                                    
                                    const newRecordNames = response.data.files.map(file => file.name);
                                    addNewRecords(newRecordNames);
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
            ]
        }
    ];
    
    let content = <h3>Choose a file</h3>
    if(recordIndex >= 0) {
        content = <>
            <h1>title/content</h1>
            
            <div className={classes.infoPanel}>
                <AudiooWaveform audio={recordsInfo[recordIndex]} />
                <button onClick={() => handleFftPressed(recordIndex)}>calculate fft</button>
            </div>
            
            
            <AudioControls 
                audio={currentAudioRef.current}
                value={sliderValue}
                duration={maxValue}
                onPlay={event => handlePlayPressed(event)}
                onChange={(value) => {handleSliderChanged(value)}} />
                
            <h2>{recordsInfo[recordIndex].name}</h2>
            
        </>;
    }
    
    return (
        <div className={classes.editPage}>
            <Menubar itemsInfo={menuItems} />
            <div className={classes.content}>
                {/* side window */}
                <div className={classes.sideArea}>
                    {/* loaded audio */}
                    <SidePanel title='audio'>
                        {recordButtons}
                    </SidePanel>
                </div>
                
                {/* main window */}
                <div className={classes.mainArea}>{content}</div>
            </div>
        </div>
    );
}

export default Edit;