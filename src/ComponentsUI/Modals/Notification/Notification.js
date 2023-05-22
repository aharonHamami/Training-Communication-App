import classes from './notification.module.css';

import errorLogo from './logo/error_logo.png';
import successLogo from './logo/success_logo.png';
import warningLogo from './logo/warning_logo.png';
import infoLogo from './logo/info_logo.png';

import { useState, createContext, useContext } from 'react';

const NotificationContext = createContext(); // global reference

export const NotificationProvider = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [info, setInfo] = useState({
    message: '',
    type: '',
    logo: null
  });

  const sendNotification = (message, currentType) => {
    switch(currentType) {
      case 'error':
        setInfo({
          message: message,
          type: classes.error,
          logo: errorLogo
        });
        break;
      case 'success':
        setInfo({
          message: message,
          type: classes.success,
          logo: successLogo
        });
        break;
      case 'info':
        setInfo({
          message: message,
          type: classes.info,
          logo: infoLogo
        });
        break;
      case 'warning':
        setInfo({
          message: message,
          type: classes.warning,
          logo: warningLogo
        });
        break;
      default: 
        setInfo({
          message: message,
          type: '',
          logo: null
        });
        break;
    }
    
    setVisible(true);
    setTimeout(() => {
        setVisible(false);
    }, 3000);
  };

  return (
    <NotificationContext.Provider value={sendNotification}>
        <div className={[classes.modal, info.type].join(' ')}
            style={{
                transform: visible ? 'translateY(0)' : 'translateY(-200%)',
                opacity: visible ? '1' : '0'
            }}>
            {info.logo ? <img src={info.logo} alt='logo' /> : null}
            {info.message}
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