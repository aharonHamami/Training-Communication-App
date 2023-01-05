import classes from './dropdown.module.css';

const dropdown = () => {
    return (
      <div className={classes.dropdown}>
        <button>option 1</button>
        <button>option 2</button>
        <button>option 3 one of them is a little bigger</button>
        <button>option 4</button>
      </div>  
    );
}

export default dropdown;