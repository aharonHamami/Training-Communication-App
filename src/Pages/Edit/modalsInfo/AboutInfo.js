import classes from './modalContent.module.css';

const info = () => (
    <div className={classes.modalContent}>
        <h1><b>About</b></h1>
        <b>Communication app for trainers</b>
        <p><b>Developer:</b> Aharon Hamamian</p>
        <p><b>Date:</b> 03/05/2023</p>
    </div>
);

export default info;