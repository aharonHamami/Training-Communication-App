import classes from './edit.module.css';

import Slider from '@mui/material/Slider';
import Box from '@mui/material/Box';
import { useState } from 'react';

import Menubar from '../../Components/Menubar/Menubar';
import SidePanel from "../../ComponentsUI/Sidebar/SidePanel";
import SideButton from '../../ComponentsUI/Sidebar/SideButton/SideButton';
import axiosServer from '../../axios/axiosServer';

const menuItems = [
    {
        label: "File",
        options: [
            {
                title: 'import file',
                action: null
            },
            {
                title: 'upload file',
                action: () => {
                    // console.log('uploading to the server...');
                    // axiosServer.post('/editing/upload-file-test')
                    //     .then(response => {
                    //         if(response.message) {
                    //             console.log('response: ', response.message);
                    //         }else {
                    //             console.log('response: ', response);
                    //         }
                    //     })
                    
                    var input = document.createElement('input');
                    input.type = 'file';
                    
                    // waiting for a file
                    input.onchange = event => {
                        const file = event.target.files[0]; // taking the file
                        
                        console.log(file);
                        
                        // we parse the file into a FormData format:
                        const formData = new FormData();
                        formData.set('myFile', file);
                        
                        // sending the file as format data
                        axiosServer.post('/editing/upload-file', formData, /*{onUploadProgress: }*/)
                            .then(response => {
                                console.log(response);
                            });
                    }
                    
                    input.click();
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

const Edit = () => {
    const [audioList] = useState([
        {name: 'audio1.mp3'},
        {name: 'audio2.mp3'},
        {name: 'audio3.mp3'},
        {name: 'audio4.mp3'},
        {name: 'audio5.mp3'}
    ]);
    const [sliderValue, setSliderValue] = useState(20);
    const maxSliderValue = 120;
    
    const audioButtons = audioList.map((info, index) => (
        <SideButton key={'audio_'+index}>
            <p>{info.name}</p>
        </SideButton>
    ));
    
    function parseToTime(totalMinutes){
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes - hours*60;
        return `${hours}:${minutes < 10 ? `0${minutes}` : minutes}`;
    }
    
    return (
        <div className={classes.editPage}>
            <Menubar itemsInfo={menuItems} />
            <div className={classes.content}>
                {/* side area */}
                <div className={classes.sideArea}>
                    {/* loaded audio */}
                    <SidePanel title='audio'>
                        {audioButtons}
                    </SidePanel>
                </div>
                
                {/* main area */}
                <div className={classes.mainArea}>
                    <div className={classes.infoPanel}>
                        <h1>title/content</h1>
                    </div>
                    {/* slider */}
                    <Slider
                        color='primary'
                        aria-label="time-indicator"
                        value={sliderValue}
                        sx={{width: '90%'}}
                        min={0}
                        step={1}
                        max={maxSliderValue}
                        onChange={(_, value) => setSliderValue(value)}
                        />
                    {/* time viewer */}
                    <Box
                        sx={{
                            width: '90%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            mt: -2,
                        }}
                        >
                        <p>{parseToTime(sliderValue)}</p>
                        <p>-{parseToTime(maxSliderValue - sliderValue)}</p>
                    </Box>
                    <div style={{display: 'flex', flexDirection: 'row', gap: "10px"}}>
                        <button>move slower</button>
                        <button>move backwards</button>
                        <button>start/stop</button>
                        <button>move forewards</button>
                        <button>move faster</button>
                    </div>
                    {/* pause, stop, skip, speed managing */}
                    <h2>audio1.mp3</h2>
                        
                </div>
            </div>
        </div>
    );
}

export default Edit;