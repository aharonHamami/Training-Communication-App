import classes from './menubar.module.css';

import MenuItem from './MenuItem/MenuItem';

const bar = (props) => {
    let menuItems = null;
    if(props.itemsInfo && Array.isArray(props.itemsInfo)){
        menuItems = props.itemsInfo.map((item, index) => (
            <MenuItem key={'item_'+index} label={item.label} options={item.options} />
        ));
    }
    
    return (
        <div className={classes.bar}>
            {menuItems}
        </div>
    );
}

export default bar;