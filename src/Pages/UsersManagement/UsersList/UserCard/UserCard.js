import classes from './UserCard.module.css';

import { useState } from 'react';
import { Button } from '@mui/material'; // ButtonGroup

import MiniCard from '../../../../ComponentsUI/MiniCard/MiniCard';
import noPictureImg from '../../images/noPicture.png';
import UserForm from './UserForm/UserForm';

const UserPlate = (props) => {
    
    const [editMode, setEditMode] = useState(false);
    
    let picture = null;
    if(props.information.picture === null) {
        picture = <img src={noPictureImg} alt='product look' />;
    }
    
    let content = null;
    if(!editMode) {
        content = <>
            <div>
                {picture}
            </div>
            <div className={classes.content}>
                <p><b>User Id:</b> {props.information.id}</p>
                <p><b>Name:</b> {props.information.name}</p>
                <p><b>Email:</b> {props.information.email}</p>
                <p><b>Password:</b> {props.information.password}</p>
                <p><b>Admin Authentication:</b> {props.information.isAdmin ? 'yes' : 'no'}</p>
                
                <div className={classes.buttons}>
                    <Button 
                        onClick={event => {setEditMode(true)}}
                        variant='contained' color='primary' style={{margin: '10px 0'}}
                        >edit</Button>
                    <Button 
                        onClick={props.onRemoveClick}
                        variant='outlined' color='error' style={{margin: '10px 0'}}
                        >remove user</Button>
                </div>
            </div>
        </>
    }else {
        const onSubmitted = userInfo => {
            setEditMode(false);
            if(userInfo){
                props.onEdit(userInfo);
            }
        }
        
        content = <>
            <div>
                {picture}
            </div>
            <div className={classes.content}>
                <UserForm information={props.information} onSubmitted={onSubmitted} />
            </div>
        </>
    }

    return (
        <div className={classes.card}>
            <MiniCard>
                {content}
            </MiniCard>
        </div>
    )
}

export default UserPlate;