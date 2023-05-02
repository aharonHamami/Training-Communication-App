import { useState, useCallback } from 'react';

import { TextField } from '@mui/material';

const StyledInput = (props) => {
    const {initialValue, pattern, error, ...restProps} = props;
    
    // const [value] = useState(initialValue || '');
    const [isError, setError] = useState(error || false);
    
    const handleChange = useCallback(event => {
        const value = event.target.value;
        
        console.log('change');
        // setValue(value);
        
        if(pattern) {
            const error = !pattern.test(value);
            console.log(pattern);
            // console.log('error: ', error);
            if(error !== isError) {
                // console.log('change error');
                setError(error);
            }
        }
    }, [isError, pattern]);
    
    return <TextField {...restProps} error={isError} /*value={initialValue || ''}*/ onChange={handleChange} />;
}

export default StyledInput