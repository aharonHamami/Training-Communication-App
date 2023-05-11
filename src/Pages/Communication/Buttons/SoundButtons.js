import SideButton from '../../../ComponentsUI/Sidebar/SideButton/SideButton';
import { Delete } from '@mui/icons-material';

const Buttons = (props) => props.soundsInfo.map((info, index) => {
    const signButton = (
        <p style={{color: info.play ? 'green' : 'red', background: 'none', border: 'none'}}>
            ⬤
        </p>
    );
    
    const deleteButton = (
        <div onClick={() => {props.onSoundDelete(index)}}>
            <Delete fontSize='small' style={{color: '#c43431'}}/>
        </div>
    );
    
    return (
        <SideButton key={'soundB_'+index} start={signButton} end={deleteButton} onClick={() => props.onSoundPressed(index)}>
            <p>{info.name}</p>
        </SideButton>
    );
});

export default Buttons;