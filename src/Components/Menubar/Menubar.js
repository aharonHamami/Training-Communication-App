import classes from './menubar.module.css';

import MenuItem from './MenuItem/MenuItem';

const bar = (props) => {
    return (
        <div className={classes.bar}>
            {props.itemsInfo.map((item, index) => (
                <MenuItem key={'item_'+index} label={item.label} options={item.options} />
            ))}
        </div>
    );
}

export default bar;