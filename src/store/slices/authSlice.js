import { createSlice } from '@reduxjs/toolkit';

const authSlice = createSlice({
    name: 'authenticate',
    initialState: {
        name: null,
        userId: null,
        token: null
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