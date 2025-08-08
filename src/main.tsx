import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './routes/App';
import CheckIn from './routes/CheckIn';
import Timeline from './routes/Timeline';
import DecisionCompass from './routes/DecisionCompass';
import Vault from './routes/Vault';
import Settings from './routes/Settings';
import './styles.css';
import './utils/i18n';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <CheckIn /> },
      { path: 'timeline', element: <Timeline /> },
      { path: 'compass', element: <DecisionCompass /> },
      { path: 'vault', element: <Vault /> },
      { path: 'settings', element: <Settings /> }
    ]
  }
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
