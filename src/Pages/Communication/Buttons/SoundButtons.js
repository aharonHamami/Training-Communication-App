import SideButton from '../../../ComponentsUI/Sidebar/SideButton/SideButton';

const Buttons = (props) => props.soundsInfo.map((info, index) => {
    const signButton = (
        <p style={{color: info.play ? 'green' : 'red', background: 'none', border: 'none'}}>
            ⬤
        </p>
    );
    
    return (
        <SideButton key={'soundB_'+index} start={signButton} onClick={() => props.onSoundPressed(index)}>
            <p>{info.name}</p>
        </SideButton>
    );
});

export default Buttons;