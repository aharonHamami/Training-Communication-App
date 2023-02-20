import { createSlice } from '@reduxjs/toolkit';

const authSlice = createSlice({
    name: 'authenticate',
    initialState: {
        name: "name_"+Math.floor(Math.random()*1000), // null
        userId: "id_"+Math.floor(Math.random()*1000), // null
        token: "token_"+Math.floor(Math.random()*1000) // null
    },
    reducers: {
        connect: (state, action) => {
            state.name = action.payload.name;
            state.userId = action.payload.userId;
            state.token = action.payload.token;
        },
        logOut: state => {
            state.name = null;
            state.userId = null;
            state.token = null;
        }
    }
});

export const {connect, logOut} = authSlice.actions;
export default authSlice.reducer;