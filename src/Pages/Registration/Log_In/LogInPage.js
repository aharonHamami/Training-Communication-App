import classes from "./log_in.module.css";

import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { Link } from 'react-router-dom';
import { useState, useCallback } from "react";
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import InputList from "../../../Components/Inputs/InputList";
import InfoCard from "../../../ComponentsUI/InfoCard/InfoCard";
import axiosServer from "../../../clients/axios/axiosClient";
import { connect } from '../../../store/slices/authSlice';

const changeValue = (setInputs, index, value) => {
    setInputs(state => {
        const newArray = [...state];
        newArray[index] = {
            ...newArray[index],
            value: value,
            validation: {
                ...newArray[index].validation,
                isValid: state[index].validation.pattern.test(value)
            }
        }
        return newArray;
    });
};

const Registration = () => {
    
    const [inputArray, setInputarray] = useState([
        {
            type: 'text-field',
            name: 'email',
            label: 'email',
            value: '',
            validation: {
                isValid: true,
                pattern: /^\w+(?:[.-]\w+)*@\w+(?:[.-]\w+)*(?:\.\w{2,3})+$/, // email pattern
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
    const navigate = useNavigate();
    
    const formSubmitted = useCallback((inputs) => {
        // event.preventDefault();
        
        // checking validation
        for(let inputObj of inputs){
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
        for(let inputObj of inputs){
            sendInfo[inputObj.name] = inputObj.value;
        }
        
        // sending request
        console.log("sending :", sendInfo);
        setIsLoading(true);
        axiosServer.post('/users/log-in', sendInfo)
            .then(response => {
                setIsLoading(false);
                console.log("server response: ", response);
                const data = response.data;
                if(data.name && data.userId) {
                    dispatch(connect({name: data.name, userId: data.userId, token: data.token, admin: data.admin}));
                    navigate('/', {replace: true});
                }
            })
            .catch(error => {
                console.log("server error: ", error);
                
                if( typeof error.response === "object"
                    && typeof error.response.data === "object" // if .data is undefined: typeof -> undefined
                    && 'message' in error.response.data ){
                            setErrorMessage(error.response.data.message);
                }else {
                    setErrorMessage("Something went wrong, try again later");
                }
                
                setIsLoading(false);
            });
    }, [dispatch, navigate]);
    
    let content = null;
    if(isLoading){
        content = <CircularProgress />;
    }else {
        content = <>
            <form className={classes.logInForm}>
                <h2>log in</h2>
                <InputList inputArray={inputArray}
                    setValue={(index, value) => {changeValue(setInputarray, index, value)}} />
                <p style={{color: 'red'}}>{errorMessage}</p>
            </form>
            <Box sx={{marginTop: '15px'}}>
                <Button variant='contained' color='success' onClick={(event) => {formSubmitted(inputArray)}}>log in</Button>
            </Box>
            <p>don't have a user yet? <Link to='/sign-up' style={{textDecoration: 'none', color: 'blue'}}>sign up</Link></p>
        </>
    }
    
    return <>
        <div className={classes.registerPage}>
            <div style={{width: '100%', paddingTop: '30px'}}>
                <InfoCard>
                    {content}
                </InfoCard>
            </div>
        </div>
    </>;
}

export default Registration;