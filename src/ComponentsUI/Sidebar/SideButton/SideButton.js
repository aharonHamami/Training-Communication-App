import classes from './sideButton.module.css';

/**
 * 
 * @param {{start, end, onClick}} props
 * @returns 
 */
const SidebarB = (props) => {
    
    let start = null;
    if(props.start){
        start = <div className={classes.start}>
            {props.start}
        </div>
    }
    
    let end = null;
    if(props.end){
        end = <div className={classes.end}>
            {props.end}
        </div>
    }
    
    return (
        <div className={classes.sideButton}>
            {start}
            <div className={classes.center} onClick={props.onClick}>
                {props.children}
            </div>
            {end}
        </div>
    );
}

export default SidebarB;