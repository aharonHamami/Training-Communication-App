import classes from './notification.module.css';

import errorLogo from './logo/error_logo.png';
import successLogo from './logo/success_logo.png';
import warningLogo from './logo/warning_logo.png';
import infoLogo from './logo/info_logo.png';

import { useState, createContext, useContext } from 'react';

const NotificationContext = createContext(); // global reference

export const NotificationProvider = ({ children }) => {
  const [message, setMessage] = useState();
  const [visible, setVisible] = useState(false);
  const [type, setType] = useState('');
  const [logo, setLogo] = useState(null);

  const sendNotification = (message, currentType) => {
    setMessage(message);
    
    switch(currentType) {
      case 'error':
        setType(classes.error);
        setLogo(errorLogo);
        break;
      case 'success':
        setType(classes.success);
        setLogo(successLogo);
        break;
      case 'info':
        setType(classes.info);
        setLogo(infoLogo);
        break;
      case 'warning':
        setType(classes.warning);
        setLogo(warningLogo);
        break;
      default: 
        setType('');
        setLogo(null);
        break;
    }
    
    setVisible(true);
    setTimeout(() => {
        setVisible(false);
    }, 3000);
  };

  return (
    <NotificationContext.Provider value={sendNotification}>
        <div className={[classes.modal, type].join(' ')}
            style={{
                transform: visible ? 'translateY(0)' : 'translateY(-200%)',
                opacity: visible ? '1' : '0'
            }}>
            {logo ? <img src={logo} alt='logo' /> : null}
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