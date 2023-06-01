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
import ErrorBoundary from './Components/ErrorBoundary';

// Error Handler component
const fallback = <div>
  <h2>Something went wrong</h2>
  <a href='/'>load again the page</a>
  <br/>
  <a href='/'>report the issue</a> {/* currently doesn't do anything */}
</div>;
const EH = (props) => <ErrorBoundary fallback={fallback}>{props.children}</ErrorBoundary>;

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
        console.log('return null intercepted');
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
        <Route path='/sign-up' element={<EH> <SignUp /> </EH>} />
        <Route path='/log-in' element={<EH> <LogIn /> </EH>} />
        <Route path='/communication' element={<EH> <Communication /> </EH>} />
        <Route path='/edit' element={<EH> <Edit /> </EH>} />
        <Route path='/users-management' element={<EH> <UsersManagement /> </EH>} />
        <Route path='/*' element={<h1>no match for this location</h1>} />
      </Routes>
    </div>
  );
}

export default App;
