import SideButton from '../../../ComponentsUI/Sidebar/SideButton/SideButton';

const Buttons = (props) => props.recordsInfo.map((info, index) => (
    <SideButton key={'audio_'+index} onClick={() => props.onPress(index)}>
        <p>{info.name}</p>
    </SideButton>
));

export default Buttons;