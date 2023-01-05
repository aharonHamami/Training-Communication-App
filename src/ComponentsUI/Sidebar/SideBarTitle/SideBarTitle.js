import classes from './sideBarTitle.module.css';

const barTitle = (props) => {
    return (
        <div className={classes.barTitle}>
            <p>{props.text}</p>
        </div>
    );
}

export default barTitle;