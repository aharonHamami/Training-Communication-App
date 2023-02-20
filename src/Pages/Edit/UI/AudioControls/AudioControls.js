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
            onChange={(_, value) => props.onChange(value)}
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
            <p>-{parseToTime(props.duration - props.value)}</p>
        </Box>
        
        {/* buttons - pause, stop, skip, speed managing */}
        <div style={{display: 'flex', flexDirection: 'row', gap: "10px"}}>
            <button>move slower</button>
            <button>move backwards</button>
            <button onClick={props.onPlay} style={{color: (isPlaying(props.audio) ? 'red' : 'black')}}>
                start/stop
            </button>
            <button>move forewards</button>
            <button>move faster</button>
        </div>
    </>;
};

export default Controls;