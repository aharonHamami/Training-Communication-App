import { useEffect, useRef } from 'react';

const Waveform = (props) => {
    const canvasRef = useRef(null);
    
    function displayWaveform(channelData) {
        const canvas = canvasRef.current;
        const canvasCtx = canvas.getContext('2d');
        
        if(channelData == null) {
            canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
            return;
        }
        
        const sliceWidth = canvas.width / channelData.length;
        
        canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
        canvasCtx.beginPath();
        for (let i = 0; i < channelData.length; i++) {
            const v = channelData[i]; // between -1 to 1
            const x = sliceWidth * i;
            const y = canvas.height/2 - v * canvas.height/2;
            if (i === 0) {
                canvasCtx.moveTo(x, y);
            } else {
                canvasCtx.lineTo(x, y);
            }
        }
        canvasCtx.lineTo(canvas.width, canvas.height / 2);
        // canvasCtx.strokeStyle = `rgb(${Math.floor(Math.random()*255)},${Math.floor(Math.random()*255)},${Math.floor(Math.random()*255)})`;
        canvasCtx.stroke(); // final painting
    } 
    
    useEffect(() => {
        displayWaveform(props.audio.waveform);
    }, [props.audio.waveform]);
    
    return (
        <canvas
            id="myCanvas"
            ref={canvasRef}
            width='1000px'
            height='200px'
            style={{border: '1px solid black', width: '90%', height: '200px'}}>
        </canvas> 
    );
}

export default Waveform;