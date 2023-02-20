export default class AudioPlayer {
    constructor(audioBuffer, context) {
        this.audioBuffer = audioBuffer;
        this.context = context;
        
        this.sourceNode = null;
        this.paused = true;
        
        this.duration = 0;
        this.startTime = 0;
        this.pausTime = 0;
    }
    
    play() {
        if(this.paused) {
            if(!this.pausTime) {
                console.log('pause time = ', this.pausTime);
                this.startTime = this.pausTime = this.context.currentTime;
                console.log('start time = ', this.startTime);
            }
            
            const offset = this.pausTime - this.startTime;
            console.log('offset: ', offset);
    
            this.sourceNode = this.context.createBufferSource();
            this.sourceNode.connect(this.context.destination); // connect to audioContext.destination - the speaker
            this.sourceNode.buffer = this.audioBuffer;
            this.sourceNode.start(0, offset); // start after 0 seconds, from 'offset'
            
            this.paused = false;
        }
    }
    
    pause() {
        if(!this.paused) {
            this.pausTime = this.context.currentTime;
            if (this.sourceNode) {    
                console.log('player: pause at ', this.pausTime);
                this.sourceNode.disconnect();
                this.sourceNode.stop(0); // auto garbage collection
                this.sourceNode = null;
            }
            this.paused = true;
        }
    }
    
    stop() {
        this.pause();
        
        this.pausTime = 0;
        this.startTime = 0;
        this.paused = true;
    }
    
    isPaused() {
        return this.paused;
    }
    
    getCurrentTime() {
        return this.pausTime - this.startTime;
    }
    
    getDuration() {
        return this.audioBuffer.duration;
    }
}