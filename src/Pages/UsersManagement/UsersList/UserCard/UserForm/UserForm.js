import { useState, useCallback } from 'react';
import { Button } from '@mui/material'; // ButtonGroup

import InputList from '../../../../../Components/InputList/InputList';

const UserForm = (props) => {
    
    const [fields, setFields] = useState([
        {
            type: 'text-field',
            name: 'name',
            label: 'User Name',
            value: props.information.name,
            validation: {
                isValid: true,
                pattern: /.{1,}/, // email pattern
                errorMessage: 'names need to have 1 letter or more'
            }
        },
        {
            type: 'text-field',
            name: 'password',
            label: 'Password',
            value: props.information.password,
            validation: {
                isValid: true,
                pattern: /^[a-zA-Z0-9]{5,15}$/,
                errorMessage: 'password must have the letters: a-z,A-Z,1-9 (5-15 characters)'
            }
        },
        {
            type: 'select',
            name: 'isAdmin',
            label: 'Is Admin?:',
            value: props.information.isAdmin,
            options: [
                {
                    text: 'yes',
                    value: true
                },
                {
                    text: 'no',
                    value: false
                }
            ],
            validation: {
                isValid: true,
                pattern: new RegExp(''), // anything
                errorMessage: "this filed must be 'yes' or 'no'"
            }
        }
    ]);
    
    const changeValue = useCallback((inputs, setInputs, index, value) => {
        console.log('change');
        const valueValidation = inputs[index].validation.pattern.test(value);
        
        const newArray = [...inputs];
        newArray[index] = {
            ...newArray[index],
            value: value,
            validation: {
                ...newArray[index].validation,
                isValid: valueValidation
            }
        }
        setInputs(newArray);
    }, []);
    
    const handleSubmit = useCallback((event, finalFields) => {
        event.preventDefault();
        console.log('submit')
        const userInfo = finalFields.reduce((info, current) => ({...info, [current.name]: current.value}), {});
        
        // checking validations:
        for(let inputObj of finalFields){
            if(!inputObj.validation.isValid){
                return; // don't submit yet
            }
        }
        
        props.onSubmitted(userInfo);
    }, [props]);
    
    return (
        <form onSubmit={event => handleSubmit(event, fields)}>
            <div style={{display: 'flex', flexDirection: 'column', gap: "10px"}}>
                <p><b>User Id:</b> {props.information.id}</p>
                <p><b>Email:</b> {props.information.email}</p>
                <InputList inputArray={fields} setValue={(index, value) => {changeValue(fields, setFields, index, value)}} />
            </div>
            <Button 
                variant='contained' color='success' style={{margin: '10px 0'}} type='submit'
                >save changes</Button>
            <Button 
                onClick={() => props.onSubmitted(null)}
                variant='outlined' color='inherit' style={{margin: '10px 0'}}
                >cancel</Button>
        </form>
    );
}

export default UserForm;