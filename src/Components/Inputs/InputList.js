import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem'; // for 'Select'
import Box from '@mui/material/Box';

// import StyledInput from './StyledInput';

const InputList = (props) => {
    
    function getInput(obj, index) {
        let isValid = true;
        if('validation' in obj) {
            isValid = obj.validation.isValid;
        }
        
        switch (obj.type) {
            case 'text-field':
                return <TextField
                            key={'input_'+index}
                            label={obj.label} value={obj.value} error={!isValid}
                            onChange={event => {props.setValue(index, event.target.value)}} variant="outlined"
                            />
                // return <StyledInput
                //             key={'input_'+index}
                //             pattern={obj.validation.pattern}
                //             />
            case 'password':
                return <TextField
                            key={'input_'+index}
                            type='password'
                            label={obj.label} value={obj.value} error={!isValid}
                            onChange={event => {props.setValue(index, event.target.value)}} variant="outlined"
                            />
            case 'select':
                return <Box key={'input_'+index} sx={{textAlign: 'left'}}>
                    <FormControl fullWidth error={!isValid}>
                        <InputLabel>{obj.label}</InputLabel>
                        <Select label='delivary speed' value={obj.value} onChange={event => {props.setValue(index, event.target.value)}}>
                            {obj.options.map(obj => {
                                return <MenuItem key={'option_'+obj.value} value={obj.value}>{obj.text}</MenuItem>
                            })}
                        </Select>
                    </FormControl>
                </Box>
            default:
                return null;
        }
    }
    
    return (
        props.inputArray.map((obj, index) => {
            return getInput(obj, index);
        })
    );
};

export default InputList;