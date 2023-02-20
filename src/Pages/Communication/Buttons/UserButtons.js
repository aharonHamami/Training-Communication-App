import SideButton from '../../../ComponentsUI/Sidebar/SideButton/SideButton';

const Buttons = (props) => props.usersInfo.map((info, index) => {
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

export default Buttons;