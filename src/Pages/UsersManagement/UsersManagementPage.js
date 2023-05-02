import classes from './UsersManagement.module.css';

import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { CircularProgress } from '@mui/material';

import UsersList from './UsersList/UsersList';
import axiosServer from '../../clients/axios/axiosClient';
import { useNotify } from '../../ComponentsUI/Modals/Notification/Notification';

const UsersManagement = () => {
    
    const [users, setUsers] = useState(null);
    const [error, setError] = useState(null);
    
    const authState = useSelector(state => state.auth);
    const notify = useNotify();
    
    useEffect(() => {
        if(!authState || !authState.admin) {
            return;
        }
        
        axiosServer.get('/users/users-info', {headers: {'Authentication': authState.token}})
            .then(response => {
                const users = response.data.users;
                // console.log('server response: ', users);
                setUsers(users.map(user => (
                    {
                        picture: null,
                        id: user.publicId,
                        name: user.name,
                        email: user.email,
                        password: user.password,
                        isAdmin: user.admin
                    }
                )));
            })
            .catch(error => {
                console.error("Error: couldn't get users info\n", error);
                setError("Error: couldn't get users info");
            });
    // ignore warning
    // eslint-disable-next-line
    }, [authState]);
    
    const handleRemoveClicked = useCallback((userIndex) => {
        const userInfo = users[userIndex];
        
        console.log('remove clicked');
        
        if(userInfo && userInfo.id) {
            if(window.confirm(`Are you sure you want to remove ${userInfo.id} (${userInfo.id})?`)) {
                console.log('remove ', userInfo.name);
                
                axiosServer.delete(`/users/${userInfo.id}`, {headers: {'Authentication': authState.token}})
                    .then(() => {
                        console.log('user deleted successfully');
                        setUsers(state => {
                            const newArray = [...state];
                            newArray.splice(userIndex, 1);
                            return newArray;
                        });
                    })
                    .catch(error => {
                        console.error("couldn't delete user", error);
                        notify("Error: couldn't delete the user");
                    });
            }
        }
    // ignore warning
    // eslint-disable-next-line
    }, [users, authState.token]);
    
    const handleEdit = useCallback((index, updateInfo) => {
        console.log('edited successfully (test)');
        console.log('what edited?', index, 'edited to:');
        console.log(updateInfo);
        
        const sendInfo = {
            name: updateInfo.name,
            password: updateInfo.password,
            admin: updateInfo.isAdmin
        };
        console.log('send:', sendInfo);
        axiosServer.post(`/users/update-user/${users[index].id}`, sendInfo, {headers: {'Authentication': authState.token}})
            .then(response => {
                console.log('server response: ', response.data);
                const newUser = response.data.user;
                setUsers(state => {
                    const newUsers = [...state];
                    newUsers[index] = { 
                        picture: null,
                        id: newUser.publicId,
                        name: newUser.name,
                        email: newUser.email,
                        password: newUser.password,
                        isAdmin: newUser.admin
                    };
                    return newUsers;
                });
            })
            .catch(error => {
                console.error(error);
                alert("Error: couldn't update the user");
            });
    }, [users, authState.token]);
    
    let content = <CircularProgress />;
    if(users) {
        content = <UsersList users={users} onRemoveClick={handleRemoveClicked} onEdit={handleEdit} />;
    }
    
    return <>
        {!authState.admin ? <Navigate to='/' replace/> : null}
        <div className={classes.usersPage}>
            <h1>Users management</h1>
            {error ? <p style={{color: 'red'}}>{error}</p> : null}
            {content}
        </div>
    </>
}

export default UsersManagement;