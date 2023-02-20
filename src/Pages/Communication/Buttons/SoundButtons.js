import SideButton from '../../../ComponentsUI/Sidebar/SideButton/SideButton';

const Buttons = (props) => props.soundsInfo.map((info, index) => {
    const signButton = (
        <p style={{color: info.play ? 'green' : 'red', background: 'none', border: 'none'}}>
            ⬤
        </p>
    );
    
    const handleClick = () => {
        if(!info.play) {
            props.play(info);
        }else {
            props.stop(info);
        }
    };
    
    return (
        <SideButton key={'soundB_'+index} start={signButton} onClick={handleClick}>
            <p>{info.name}</p>
        </SideButton>
    );
});

export default Buttons;