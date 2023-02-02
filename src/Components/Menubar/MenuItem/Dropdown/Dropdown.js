import classes from './dropdown.module.css';

const dropdown = (props) => {
    return (
      <div className={classes.dropdown}>
        {props.options.map((option, index) => (
          <button key={'option_'+index} onClick={option.action} >{option.title}</button>
        ))}
      </div>  
    );
}

export default dropdown;