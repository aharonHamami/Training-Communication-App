import classes from './edit.module.css';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { CircularProgress, Modal } from '@mui/material';
import { Download } from '@mui/icons-material';
import fixWebmDuration from "fix-webm-duration";

import Menubar from '../../Components/Menubar/Menubar';
import SidePanel from "../../ComponentsUI/Sidebar/SidePanel";
import RecordButtons from './Buttons/RecordButtons';
import axiosServer from '../../clients/axios/axiosClient';
import AudioControls from '../../Components/AudioControls/AudioControls';
import AudioWaveform from './UI/AudioWaveform/AudioWaveform';
import AboutInfo from './modalsInfo/AboutInfo';
import HowToUseInfo from './modalsInfo/HowToUseInfo';
import { useNotify } from '../../ComponentsUI/Modals/Notification/Notification';

let audioCtx;
let urlList;

function audioBufferToOggBlob(audioBuffer) {
    return new Promise((resolve, reject) => {
        console.log('change buffer to blob');
        const source = audioCtx.createBufferSource();
        source.buffer = audioBuffer;
        const destination = audioCtx.createMediaStreamDestination();
        source.connect(destination);
        // (new AudioContext()).createBufferSource().on
        const mediaRecorder = new MediaRecorder(destination.stream);
        let startRecordTime;
        const chunks = [];
        
        mediaRecorder.ondataavailable = event => {
            console.log('data available');
            chunks.push(event.data);
        };

        mediaRecorder.onstop = () => {
            const mediaDuration = Date.now() - startRecordTime;
            console.log('stopped recording');
            const blob = new Blob(chunks, { type: 'audio/ogg' });
            // MediaRecorder doesn't include duration header - this liberary fix that and add that to the blob:
            fixWebmDuration(blob, mediaDuration, (fixedBlob) => {
                resolve(fixedBlob);
            });
        };

        console.log('start recording');
        mediaRecorder.start(); // start recording
        
        // const source = audioCtx.createBufferSource();
        // source.buffer = audioBuffer;
        // source.connect(mediaRecorder);
        source.start(); // start stream
        startRecordTime = Date.now();
        source.onended = () => {
            console.log('ended');
            mediaRecorder.stop();
        }
    });
}

// data-title={classes.dot_flashing}
const dotFlasingAnimation = <div className={classes.col_3}>
    <div className={classes.snippet} >
        <div className={classes.stage}>
            <div className={classes.dot_flashing}></div>
        </div>
    </div>
</div>;

const Edit = () => {
    // page settings:
    const [recordsInfo, setRecordsInfo] = useState(null); // [{name: 'name', recordName: 'record.mp3', audio: audioObj, waveform: waveformData}]
    const [recordIndex, setRecordIndex] = useState(-1);
    const [algorithmOn, setAlgorithmOn] = useState(false);
    const [modalInfo, setModalInfo] = useState(null); // about, 
    const [darkMode, setDarkMode] = useState(false);
    // audio controls settings:
    const [sliderValue, setSliderValue] = useState(0);
    const [maxValue, setMaxValue] = useState(100);
    // audio waveform settings:
    const [range, setRange] = useState([10, 30]);
    
    const authState = useSelector(state => state.auth);
    const notify = useNotify();
    
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
                                    console.error("Couldn't send the files: ", error);
                                    notify("Couldn't upload new recordings", 'error');
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
                    action: () => {setDarkMode(state => !state)}
                }
            ]
        },
        {
            label: "Help",
            options: [
                {
                    title: 'how to use?',
                    action: () => {setModalInfo('howToUse')}
                },
                {
                    title: 'about',
                    action: () => {setModalInfo('about')}
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
    }, []);
    
    const updateRecord = useCallback((index, info) => {
        setRecordsInfo(state => {
            const newRecordsInfo = [...state];
            newRecordsInfo[index] = {...newRecordsInfo[index], ...info};
            return newRecordsInfo;
        });
    }, []);
    
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
                console.error("Error: couldn't get record names from server: \n", error);
                notify("Error: couldn't get record names from server", 'error');
            });
        
        return () => {
            console.log('delete all urls');
            for(const url of urlList) {
                URL.revokeObjectURL(url);
            }
        }
    // ignore warning
    // eslint-disable-next-line
    }, [authState, addNewRecords]);
    
    // handle the audio selected
    useEffect(() => {
        if(recordIndex >= 0 && recordsInfo[recordIndex].audio) {
            const currentRecordInfo = recordsInfo[recordIndex];
            currentAudioRef.current = currentRecordInfo.audio;
            
            currentAudioRef.current.onloadedmetadata = () => {
                if (currentAudioRef.current.duration !== Infinity) {
                    setMaxValue(currentAudioRef.current.duration);
                }else {
                    // Temporary fix for a bug in Chrome and Edge:
                    setMaxValue(0);
                    currentAudioRef.current.currentTime = 10000000; // play with the time to 'wake up' the duration
                    setTimeout(() => {
                        currentAudioRef.current.currentTime = 0;
                        setMaxValue(currentAudioRef.current.duration);
                    }, 500);
                }
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
                recordAudio.preload = 'metadata'; // test
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
    
    const handleRecordDelete = useCallback((records, index) => {
        const recordInfo = records[index];
        const name = recordInfo.name;
        
        if(window.confirm(`Are you sure you want to delete ${name}?`)) {
            console.log('delete record: ', name);
            
            axiosServer.delete('/editing/records/'+name, {headers: {'Authentication': authState.token}})
                .then(response => {
                    console.log('Server response: \n', response);
                    
                    // return index to track his record
                    setRecordIndex(state => {
                        if(state < index) return state;
                        if(state === index) return -1;
                        return state - 1; // if state > index
                    });
                    setRecordsInfo(state => {
                        const newArray = [...state];
                        newArray.splice(index, 1);
                        return newArray;
                    });
                })
                .catch(error => {
                    console.error("couldn't delete the redording", error);
                    notify("Error: couldn't delete the recording", 'error');
                });
        }
            
    // ignore warning
    // eslint-disable-next-line
    }, [authState.token]);
    
    const handleFftPressed = useCallback((records, index) => {
        console.log('calculate FFT');
        let waveform = records[index].waveform;
        
        setAlgorithmOn(true);
        axiosServer.post('/editing/edit/calculateFFT', {signal: waveform},
        {headers: {'Authentication': authState.token}})
            .then(response => {
                fftRef.current = response.data.FFT;
                
                console.log('server response: ', response.data);
                let fftWaveform = response.data.FFT.map(cmplxNum => Math.sqrt(cmplxNum.re**2 + cmplxNum.im**2)); // abs
                fftWaveform = fftWaveform.slice(0, fftWaveform.length/2);
                // fftWaveform = fftWaveform.slice(fftWaveform.length/10, fftWaveform.length - fftWaveform.length/10);
                
                // adjust the signal to show it in the waveform graph
                const max = fftWaveform.reduce((max, currentValue) => Math.max(max, currentValue));
                fftWaveform = fftWaveform.map(val => val/max);
                
                // console.log('fft waveform: ', fftWaveform);
                
                updateRecord(index, {waveform: fftWaveform});
                setAlgorithmOn(false);
            })
            .catch(error => {
                console.error("Couldn't get fft info from the server:\n", error);
                notify("Error: Couldn't get FFT from the server", 'error');
                setAlgorithmOn(false);
            });
    // ignore warning
    // eslint-disable-next-line
    }, [authState.token, updateRecord]);
    
    const handleIfftPressed = useCallback((index) => {
        console.log('calculate IFFT');
        
        setAlgorithmOn(true);
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
                setAlgorithmOn(false);
            })
            .catch(error => {
                console.log("Couldn't get dtf info from the server:\n", error);
                notify("Error: Couldn't get IFFT from the server", 'error');
                setAlgorithmOn(false);
            });
    // ignore warning
    // eslint-disable-next-line
    }, [authState.token, updateRecord]);
    
    const handleReduceNoise = useCallback((records, index) => {
        console.log('reduce noise');
        const waveform = records[index].waveform;
        
        // convert percentage from range to an index in the channel data
        const percentageToIndex = (value) => {
            const waveformSize = waveform.length;
            return Math.floor(waveformSize * (value/100));
        }
        
        const domain = {
            start: percentageToIndex(range[0]),
            size: percentageToIndex(range[1] - range[0])
        }
        
        console.log('slider domain: ', domain);
        
        setAlgorithmOn(true);
        axiosServer.post('/editing/edit/removeNoise',
            {
                signal: waveform,
                speachDomain: {start: 0, size: waveform.length},
                // noiseDomain: {start: 7000, size: 2**10} // noise needs to be a power of 2
                noiseDomain: domain
            },
            {headers: {'Authentication': authState.token}})
            .then(response => {
                console.log('server response: ', response.data);
                
                let signal = response.data.signal.map(sample => {
                    if(typeof sample === 'number') return sample;
                    return sample.re
                });
                
                // save the signal:
                const audioBuffer = audioCtx.createBuffer(1, signal.length, audioCtx.sampleRate);
                // myArrayBuffer.copyFromChannel(new Float32Array(signal), 0);
                const audioData = audioBuffer.getChannelData(0);
                // copy the signal to the audio buffer:
                for (let i = 0; i < audioBuffer.length; i++) {
                    audioData[i] = signal[i];
                }
                // convert audio buffer to blob
                audioBufferToOggBlob(audioBuffer)
                    .then(blob => {
                        console.log('finished');
                        const audio = currentAudioRef.current;
                        const newUrl = URL.createObjectURL(blob);
                        urlList.splice(urlList.indexOf(audio.src), 1, newUrl); // replace the old url
                        URL.revokeObjectURL(audio.src);
                        audio.src = newUrl;
                        setAlgorithmOn(false);
                    })
                    .catch(error => {
                        console.error("Errro - couldn't make a blob: ", error);
                        setAlgorithmOn(false);
                    });
                
                const source = audioCtx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(audioCtx.destination);
                source.start();
                setAlgorithmOn(false);
                updateRecord(index, {waveform: signal});
            })
            .catch(error => {
                console.error("Error: couldn't remove the noise:\n", error);
                notify("Error: Couldn't remove the noise", 'error');
                setAlgorithmOn(false);
            });
    // ignore warning
    // eslint-disable-next-line
    }, [authState.token, updateRecord]);
    
    const handleCloseModal = useCallback(() => { setModalInfo(null) }, []);
    
    let recordButtons = <CircularProgress />;
    if(recordsInfo) {
        recordButtons = <RecordButtons recordsInfo={recordsInfo}
                            onPress={(index) => {handleRecordPressed(recordsInfo, index)}}
                            onRedocdDelete={(index) => {handleRecordDelete(recordsInfo, index)}} />;
    }
    
    let modalContent = null;
    switch(modalInfo) {
        case 'about':
            modalContent = <AboutInfo />;
            break;
        case 'howToUse':
            modalContent = <HowToUseInfo />;
            break;
        default: break;
    }
    
    let content = <p style={{margin: 'auto'}}>No file selected</p>
    if(recordIndex >= 0 && recordIndex < recordsInfo.length) {
        content = <>
            <h1>Audio Explorer</h1>
            
            <div className={classes.infoPanel}>
                <AudioWaveform audio={recordsInfo[recordIndex]} range={range} changeRange={setRange} />
                <div style={{display: 'flex', flexDirection: 'row', gap: '5px'}}>
                    {
                        !algorithmOn ?
                        <>
                            {currentAudioRef.current ? <a style={{position: ''}} href={currentAudioRef.current.src} download ><Download style={{height: '100%'}} /></a> : null}
                            <button onClick={() => {handleFftPressed(recordsInfo, recordIndex)}}>calculate fft</button>
                            <button onClick={() => {handleIfftPressed(recordIndex)}}>calculate ifft</button>
                            <button onClick={() => {handleReduceNoise(recordsInfo, recordIndex)}}>reduce noise</button>
                        </>
                        : <div style={{marginTop: '10px'}}>{dotFlasingAnimation}</div>
                    }
                </div>
                
            </div>
            
            <AudioControls 
                audioRef={currentAudioRef}
                value={sliderValue}
                duration={maxValue}
                // !! need to find a better solution to duration
                 />
                
            <h2>{recordsInfo[recordIndex].name}</h2>
            
        </>;
    }
    
    let contentClass = classes.mainArea;
    if(darkMode) {
        contentClass = classes.mainArea + ' ' + classes.darkMode;
    }
    
    return <>
        {!authState.admin ? <Navigate to='/' replace/> : null}
        <Modal open={modalInfo != null} onClose={handleCloseModal}>
            <div>
                {modalContent}
            </div>
        </Modal>
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
                <div className={contentClass}>
                    {content}
                </div>
            </div>
        </div>
    </>;
}

export default Edit;