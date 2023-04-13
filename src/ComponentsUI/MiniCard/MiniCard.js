import classes from './miniCard.module.css';

const MiniCard = (props) => {
    return (
      <div className={classes.card}>
        {props.children}
      </div>  
    );
};

export default MiniCard;