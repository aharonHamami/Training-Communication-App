import { createSlice } from '@reduxjs/toolkit';

const authSlice = createSlice({
    name: 'authenticate',
    initialState: {
        name: null,
        userId: null,
        token: null,
        admin: false
        // name: "name_"+Math.floor(Math.random()*1000),
        // userId: "id_"+Math.floor(Math.random()*1000),
        // token: "token_"+Math.floor(Math.random()*1000),
        // admin: true
    },
    reducers: {
        connect: (state, action) => {
            state.name = action.payload.name;
            state.userId = action.payload.userId;
            state.token = action.payload.token;
            state.admin = action.payload.admin;
        },
        logOut: state => {
            state.name = null;
            state.userId = null;
            state.token = null;
            state.admin = false;
        }
    }
});

export const {connect, logOut} = authSlice.actions;
export default authSlice.reducer;