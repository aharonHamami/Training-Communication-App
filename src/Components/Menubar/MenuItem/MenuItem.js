import classes from './menuItem.module.css';

import Dropdown from './Dropdown/Dropdown';

const item = (props) => {
    return (
        <div className={classes.mItem}>
            <button>
                {props.label}
            </button>
            <div className={classes.dropdownDiv}>
                <Dropdown options={props.options} />
            </div>
        </div>
    );
}

export default item;