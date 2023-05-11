import SideButton from '../../../ComponentsUI/Sidebar/SideButton/SideButton';
import { Delete } from '@mui/icons-material'

const Buttons = (props) => props.recordsInfo.map((info, index) => {
    const end = (
        <div onClick={() => {props.onRedocdDelete(index)}}>
            <Delete fontSize='small' style={{color: '#c43431'}}/>
        </div>
    );
    
    return (
        <SideButton key={'audio_'+index} onClick={() => {props.onPress(index)}} end={end}>
            <p>{info.name}</p>
        </SideButton>
    );
});

export default Buttons;