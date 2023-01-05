import classes from './communication.module.css';

import { useState } from 'react';

import SidePanel from '../../ComponentsUI/Sidebar/SidePanel';
import SideButton from '../../ComponentsUI/Sidebar/SideButton/SideButton';

const Communication = () => {
    const [usersInfo] = useState([
        {name: 'hello', signed: false},
        {name: 'world', signed: false},
        {name: 'first name', signed: true},
        {name: 'first name', signed: true},
        {name: 'second name', signed: false}
    ]);
    
    const [soundInfo] = useState([
        {name: 'sound1.png'},
        {name: 'sound2.png'},
        {name: 'sound3.png'},
        {name: 'sound4.png'}
    ]);
    
    const usersButtons = usersInfo.map((info, index) => {
        const signButton = (
            <button style={{color: info.signed ? 'green' : 'red', background: 'none', border: 'none'}}>
                ⬤
            </button>
        );
        
        return (
            <SideButton key={'userB_'+index} start={signButton}>
                <p>{info.name}</p>
            </SideButton>
        );
    });
    
    const soundButtons = soundInfo.map((info, index) => (
        <SideButton key={'soundB_'+index}>
            <p>{info.name}</p>
        </SideButton>
    ));
    
    return (
        <div className={classes.communication}>
            
            {/* side area */}
            <div className={classes.sideArea}>
                <SidePanel title='users' size={4}>
                    {usersButtons}
                </SidePanel>
                <SidePanel title='sound' size={4}>
                    {soundButtons}
                </SidePanel>
            </div>
            
            {/* main area */}
            <div className={classes.mainArea}>
                <div className={classes.infoPanel}>
                    <h1>some info during the running...</h1>
                </div>
                <div className={classes.controlPanel}>
                    <button>speak to everyone</button>
                    <button>speak to the selected group</button>
                </div>
            </div>
            
        </div>
    );
};

export default Communication;