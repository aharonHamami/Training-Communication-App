import './App.css';

import { Routes, Route } from 'react-router-dom';

import HomePage from './Pages/HomePage/HomePage';
import Communication from './Pages/Communication/CommunicationPage';
import Edit from './Pages/Edit/EditPage';
import SignUp from './Pages/Registration/Sign_up/SignUpPage';
import LogIn from "./Pages/Registration/Log_In/LogInPage";

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path='/' element={<HomePage />} />
        <Route path='/sign-up' element={<SignUp />} />
        <Route path='/log-in' element={<LogIn />} />
        <Route path='/communication' element={<Communication />} />
        <Route path='/edit' element={<Edit />} />
        <Route path='/*' element={<h1>no match for this location</h1>} />
      </Routes>
    </div>
  );
}

export default App;
