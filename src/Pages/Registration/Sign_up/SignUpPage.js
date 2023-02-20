import classes from "./sign_up.module.css";

import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { useState } from "react";
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import InputList from "../../../Components/InputList/InputList";
import InfoCard from "../../../ComponentsUI/InfoCard/InfoCard";
import axiosServer from '../../../clients/axios/axiosClient';
import { connect } from '../../../store/slices/authSlice';

const Registration = () => {
    
    const [inputArray, setInputarray] = useState([
        {
            type: 'text-field',
            name: 'name',
            label: 'name',
            value: '',
            validation: {
                isValid: true,
                pattern: /.{1,}/, // name pattern
                errorMessage: 'your must have a name'
            }
        },
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
                pattern: /^[a-zA-Z0-9]{5,15}$/,
                errorMessage: 'password must have the letters: a-z,A-Z,1-9 (5-15 characters)'
            }
        }
    ]);
    
    const [errorMessage, setErrorMessage] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    
    const dispatch = useDispatch();
    
    const navigate = useNavigate();
    
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
        axiosServer.post('/users/sign-up', sendInfo)
            .then(response => {
                console.log("server response: ", response);
                dispatch(connect({name: sendInfo.name, userId: response.data.userId, token: response.data.token}));
                setIsLoading(false);
                navigate('/communication', {replace: true});
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
    if(isLoading) {
        content = <CircularProgress />;
    }else {
        content = <>
            <form className={classes.logInForm}>
                <h2>sign up</h2>
                <InputList inputArray={inputArray} setValue={changeValue} />
                <p style={{color: 'red'}}>{errorMessage}</p>
            </form>
            <Box onSubmit={formSubmitted} sx={{marginTop: '15px'}}>
                <Button variant='contained' color='success' onClick={formSubmitted}>sign up</Button>
            </Box>
        </>;
    }
    
    return <>
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