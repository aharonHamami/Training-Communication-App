import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import ErrorBoundary from './Components/ErrorBoundary';

// import
import store from './store/store';
import { NotificationProvider } from './ComponentsUI/Modals/Notification/Notification';

const root = ReactDOM.createRoot(document.getElementById('root'));

const fallback = <div>
  <h2>Something went wrong</h2>
  <p>Try to come again later</p>
</div>;

const app = (
  <ErrorBoundary fallback={fallback}>
    <Provider store={store}>
      <BrowserRouter>
        <NotificationProvider>
          <App />
        </NotificationProvider>
      </BrowserRouter>
    </Provider>
  </ErrorBoundary>
);

root.render(app);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
