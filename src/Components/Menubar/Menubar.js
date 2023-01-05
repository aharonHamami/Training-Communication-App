import classes from './menubar.module.css';

import MenuItem from './MenuItem/MenuItem';

const bar = () => {
    return (
        <div className={classes.bar}>
            <MenuItem label="File" /> {/* need to add options property */}
            <MenuItem label="View" />
            <MenuItem label="Help" />
        </div>
    );
}

export default bar;