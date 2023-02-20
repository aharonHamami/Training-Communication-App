import classes from './sideButton.module.css';

// need to add start and end

const SidebarB = (props) => {
    
    let start = null;
    if(props.start){
        start = <div>
            {props.start}
        </div>
    }
    
    let end = null;
    if(props.end){
        end = <div>
            {props.end}
        </div>
    }
    
    return (
        <div className={classes.sideButton} onClick={props.onClick}>
            {start}
            <div style={{flexGrow: '1'}}>
                {props.children}
            </div>
            {end}
        </div>
    );
}

export default SidebarB;