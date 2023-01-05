import classes from './infoCard.module.css';

const InfoCard = (props) => {
    return (
        <div className={classes.infoCard}>
            {props.children}
        </div>
    );
};

export default InfoCard;