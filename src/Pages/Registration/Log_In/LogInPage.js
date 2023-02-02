import classes from "./log_in.module.css";

import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { Link } from 'react-router-dom';
import { useState } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

import InputList from "../../../Components/InputList/InputList";
import InfoCard from "../../../ComponentsUI/InfoCard/InfoCard";
import axiosServer from "../../../axios/axiosServer";
import { connect } from '../../../store/slices/authSlice';

const Registration = (props) => {
    
    const [inputArray, setInputarray] = useState([
        {
            type: 'text-field',
            name: 'email',
            label: 'email',
            value: '',
            validation: {
                isValid: true,
                pattern: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, // email pattern
                errorMessage: 'please write a valid email'
            }
        },
        {
            type: 'password',
            name: 'password',
            label: 'password',
            value: '',
            validation: {
                isValid: true,
                pattern: /^.{5,15}$/, // min-max pattern
                errorMessage: 'password must be between 5-15 characters long'
            }
        }
    ]);
    
    const [errorMessage, setErrorMessage] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    
    const dispatch = useDispatch();
    const authState = useSelector(state => state.auth);
    
    const changeValue = (index, value) => {
        const valueValidation = inputArray[index].validation.pattern.test(value);
        
        const newArray = [...inputArray];
        newArray[index] = {
            ...newArray[index],
            value: value,
            validation: {
                ...newArray[index].validation,
                isValid: valueValidation
            }
        }
        setInputarray(newArray);
    }
    
    const formSubmitted = (event) => {
        // event.preventDefault();
        
        // checking validation
        for(let inputObj of inputArray){
            // if the input is not filled
            if(inputObj.value === ""){
                setErrorMessage("all the fields must be full");
                return;
            }
            // if the user filled the input but the input is not valid
            if(!inputObj.validation.isValid){
                setErrorMessage(inputObj.validation.errorMessage);
                return;
            }
        }
        setErrorMessage(null);
        
        // making request
        const sendInfo = {};
        for(let inputObj of inputArray){
            sendInfo[inputObj.name] = inputObj.value;
        }
        
        // sending request
        console.log("sending :", sendInfo);
        setIsLoading(true);
        axiosServer.post('/users/log-in', sendInfo)
            .then(response => {
                console.log("server response: ", response);
                dispatch(connect({name: response.data.name, userId: response.data.userId, token: response.data.token}));
                setIsLoading(false);
            })
            .catch(error => {
                console.log("server error: ", error);
                
                if( typeof error.response === "object"
                    && typeof error.response.data === "object" // if .data is undefined: typeof -> undefined
                    && 'message' in error.response.data ){
                            setErrorMessage(error.response.data.message);
                }else {
                    setErrorMessage(error.message);
                }
                
                setIsLoading(false);
            });
    }
    
    let content = null;
    if(isLoading){
        content = <CircularProgress />;
    }else {
        content = <>
            <form className={classes.logInForm}>
                <h2>log in</h2>
                <InputList inputArray={inputArray} setValue={changeValue} />
                <p style={{color: 'red'}}>{errorMessage}</p>
            </form>
            <Box onSubmit={formSubmitted} sx={{marginTop: '15px'}}>
                <Button variant='contained' color='success' onClick={formSubmitted}>log in</Button>
            </Box>
            <p>don't have a user yet? <Link to='/sign-up' style={{textDecoration: 'none', color: 'blue'}}>sign up</Link></p>
        </>
    }
    
    return <>
        {authState.userId ? <Navigate to='/communication' replace/> : null}
        <div className={classes.registerPage}>
            <div style={{width: '100%'}}>
                <InfoCard>
                    {content}
                </InfoCard>
            </div>
        </div>
    </>;
}

export default Registration;