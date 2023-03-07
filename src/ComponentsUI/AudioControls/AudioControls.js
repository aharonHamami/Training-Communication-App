import { useState } from 'react';
import { Box, Slider } from '@mui/material';

function parseToTime(totalSeconds){
    if(totalSeconds < 0) {
        totalSeconds = 0;
    }
    
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.round(totalSeconds - minutes*60);
    return `${minutes}:${seconds < 10 ? `0${seconds}` : seconds}`;
}

function isPlaying(audio) {
    if(audio && !audio.paused && audio.currentTime > 0) {
        return true;
    }
    return false;
}

const Controls = (props) => {
    const [playbackRate, setPlaybackRate] = useState('x1');
    
    const handleSliderChanged = (value) => {
        props.audioRef.current.currentTime = value;
    };
    
    const handlePlayPressed = (event) => {
        const audio = props.audioRef.current;
        if(isPlaying(audio)) {
            audio.pause();
        }else {
            audio.play();
        }
        setPlaybackRate(`x${audio.playbackRate}`);
    };
    
    const handleSpeedPressed = (faster) => {
        const audio = props.audioRef.current;
        if(faster && audio.playbackRate < 1.5) {
            audio.playbackRate += 0.5;
            setPlaybackRate(`x${audio.playbackRate}`);
        }else if(!faster && audio.playbackRate > 0.5) {
            audio.playbackRate -= 0.5;
            setPlaybackRate(`x${audio.playbackRate}`);
        }
    }
    
    const handleSkipPressed = (time) => {
        props.audioRef.current.currentTime += time;
    }
    
    return <>
        {/* slider */}
        <Slider
            color='primary'
            aria-label="time-indicator"
            value={props.value}
            sx={{width: '90%'}}
            min={0}
            step={1}
            max={props.duration}
            onChange={(_, value) => handleSliderChanged(value)}
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
            <p>{parseToTime(props.value)}</p>
            <p>{playbackRate}</p>
            <p>-{parseToTime(props.duration - props.value)}</p>
        </Box>
        
        {/* buttons - pause, stop, skip, speed managing */}
        <div style={{display: 'flex', flexDirection: 'row', gap: "10px"}}>
            <button onClick={() => {handleSpeedPressed(false)}} >move slower</button>
            <button onClick={() => {handleSkipPressed(-2)}} >move backwards</button>
            <button onClick={handlePlayPressed} style={{color: (isPlaying(props.audioRef.current) ? 'red' : 'black')}}>
                start/stop
            </button>
            <button onClick={() => {handleSkipPressed(2)}} >move forewards</button>
            <button onClick={() => {handleSpeedPressed(true)}} >move faster</button>
        </div>
    </>;
};

export default Controls;