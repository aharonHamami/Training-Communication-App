import classes from "./sidepanel.module.css";

import SideBarTitle from "./SideBarTitle/SideBarTitle";

// props = {title, size, children}
const bar = (props) => {
    return (
        <div className={classes.sidePanel} style={{flexGrow: props.size}}>
            <SideBarTitle text={props.title} action={props.titleAction} />
            {props.children}
        </div>
    );
}

export default bar;