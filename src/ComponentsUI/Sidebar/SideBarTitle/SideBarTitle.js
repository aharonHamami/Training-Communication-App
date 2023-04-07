import classes from './sideBarTitle.module.css';
import AddBoxIcon from '@mui/icons-material/AddBoxOutlined';

const barTitle = (props) => {
    let actionButton = null;
    if(props.action) {
        actionButton = <div style={{display: 'flex', justifyContent: 'center'}} onClick={props.action} >
            <AddBoxIcon color='primary' sx={{margin: 'auto'}}/>
        </div>;
    }
    
    return (
        <div className={classes.barTitle}>
            <div style={{flexGrow: '1', textAlign: 'left'}}>
                <p>{props.text}</p>
            </div>
            {actionButton}
        </div>
    );
}

export default barTitle;