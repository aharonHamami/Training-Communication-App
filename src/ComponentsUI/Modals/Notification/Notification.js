import classes from './notification.module.css';

import errorLogo from './error_logo.png';

import { useState, createContext, useContext } from 'react';

const NotificationContext = createContext(); // global reference

export const NotificationProvider = ({ children }) => {
  const [message, setMessage] = useState();
  const [visible, setVisible] = useState(false);

  const sendNotification = (message) => {
    setMessage(message);
    
    setVisible(true);
    setTimeout(() => {
        setVisible(false);
    }, 3000);
  };

  return (
    <NotificationContext.Provider value={sendNotification}>
        <div 
            className={classes.modal}
            style={{
                transform: visible ? 'translateY(0)' : 'translateY(-200%)',
                opacity: visible ? '1' : '0'
            }}>
            <img src={errorLogo} alt='logo' />
            {message}
        </div>
        {children}
    </NotificationContext.Provider>
  );
};

export const useNotify = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};