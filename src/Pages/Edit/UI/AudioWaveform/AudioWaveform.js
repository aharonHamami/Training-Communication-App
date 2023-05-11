import { useEffect, useRef, useCallback } from 'react';
import { Slider } from '@mui/material';

const Waveform = (props) => {
    const canvasRef = useRef();
    
    const displayWaveform = useCallback((channelData) => {
        const canvas = canvasRef.current;
        const canvasCtx = canvas.getContext('2d');
        
        if(channelData == null) {
            canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
            return;
        }
        
        const sliceWidth = canvas.width / channelData.length;
        
        canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
        canvasCtx.beginPath();
        canvasCtx.moveTo(0, canvas.height / 2);
        for (let i = 0; i < channelData.length; i++) {
            const v = channelData[i]; // between -1 to 1
            const x = sliceWidth * i;
            const y = canvas.height/2 - v * canvas.height/2;
            canvasCtx.lineTo(x, y);
        }
        canvasCtx.lineTo(canvas.width, canvas.height / 2);
        // canvasCtx.strokeStyle = `rgb(${Math.floor(Math.random()*255)},${Math.floor(Math.random()*255)},${Math.floor(Math.random()*255)})`;
        canvasCtx.stroke(); // final painting
    }, []);
    
    const handleRangeChange = useCallback((event, value) => {
        props.changeRange(value);
    }, [props]);
    
    const getValueText = useCallback((value) => {
        if(props.audio.waveform) {
            const waveformSize = props.audio.waveform.length;
            return Math.floor(waveformSize * (value/100));
        }
    }, [props.audio.waveform]);
    
    useEffect(() => {
        displayWaveform(props.audio.waveform);
    }, [props.audio.waveform, displayWaveform]);
    
    return <>
        <canvas
            id="myCanvas"
            ref={canvasRef}
            width='1000'
            height='300'
            style={{border: '1px solid black', width: '90%', height: '300px', backgroundColor: 'white'}}
        />
        <Slider 
            value={props.range}
            onChange={handleRangeChange}
            valueLabelDisplay="auto"
            valueLabelFormat={getValueText}
            size='small'
            style={{width: '90%', color: '#820000'}}
        />
    </>;
}

export default Waveform;