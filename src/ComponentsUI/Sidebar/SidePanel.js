import classes from "./sidepanel.module.css";

import SideBarTitle from "./SideBarTitle/SideBarTitle";

// props = {title, size, children}
const bar = (props) => {
    return <>
        <SideBarTitle text={props.title} action={props.titleAction} />
        <div className={classes.sidePanel} style={{flexGrow: props.size}}>
            {props.children}
        </div>
    </>;
}

export default bar;