import './App.css';

import { Routes, Route } from 'react-router-dom';

import Communication from './Pages/Communication/Communication';
import Edit from './Pages/Edit/Edit';
import SignUp from './Pages/Registration/Sign_up/SignUp';
import LogIn from "./Pages/Registration/Log_In/LogIn";

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path='/' element={[<h1>home page</h1>, <h2>available pages:</h2>, <p>/sign-up</p>, <p>/log-in</p>, <p>/communication</p>, <p>/edit</p>]} />
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
