import classes from './App.module.css';

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Routes, Route, useNavigate } from 'react-router-dom';

// pages:
import HomePage from './Pages/HomePage/HomePage';
import Communication from './Pages/Communication/CommunicationPage';
import Edit from './Pages/Edit/EditPage';
import SignUp from './Pages/Registration/Sign_up/SignUpPage';
import LogIn from "./Pages/Registration/Log_In/LogInPage";
import UsersManagement from './Pages/UsersManagement/UsersManagementPage';

import axiosServer from './clients/axios/axiosClient';
import { logOut } from './store/slices/authSlice';
import { useNotify } from './ComponentsUI/Modals/Notification/Notification';


function App() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const notify = useNotify();
  
  useEffect(() => {
    axiosServer.interceptors.response.use(null, error => {
      if(error.response && error.response.status === 401){ // Unauthorized
        console.log('user was unauthorized, going back to home page.');
        notify("You are unauthorized, returning back to home page", 'error');
        dispatch(logOut());
        navigate('/');
      }
      return Promise.reject(error);
    });
    // ignore navigate dependency error:
    // Don't delete this line
    // eslint-disable-next-line
  }, [dispatch]);
  
  return (
    <div className={classes.App}>
      <Routes>
        <Route path='/' element={<HomePage />} />
        <Route path='/sign-up' element={<SignUp />} />
        <Route path='/log-in' element={<LogIn />} />
        <Route path='/communication' element={<Communication />} />
        <Route path='/edit' element={<Edit />} />
        <Route path='/users-management' element={<UsersManagement />} />
        <Route path='/*' element={<h1>no match for this location</h1>} />
      </Routes>
    </div>
  );
}

export default App;
