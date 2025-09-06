/// <reference types="vite-plugin-pwa/client" />
import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './routes/App';
const CheckIn = lazy(() => import('./routes/CheckIn'));
const Timeline = lazy(() => import('./routes/Timeline'));
const DecisionCompass = lazy(() => import('./routes/DecisionCompass'));
const Vault = lazy(() => import('./routes/Vault'));
const Settings = lazy(() => import('./routes/Settings'));
const Insights = lazy(() => import('./routes/Insights'));
const Sync = lazy(() => import('./routes/Sync'));
const Planner = lazy(() => import('./routes/Planner'));
const MindMap = lazy(() => import('./routes/MindMap'));
const Assistant = lazy(() => import('./routes/Assistant'));
import Safety from './routes/Safety';
import './styles.css';
import './utils/i18n';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
  { index: true, element: <Suspense fallback={<div style={{padding:16}}>Loading…</div>}><CheckIn /></Suspense> },
  { path: 'timeline', element: <Suspense fallback={<div style={{padding:16}}>Loading…</div>}><Timeline /></Suspense> },
  { path: 'compass', element: <Suspense fallback={<div style={{padding:16}}>Loading…</div>}><DecisionCompass /></Suspense> },
  { path: 'insights', element: <Suspense fallback={<div style={{padding:16}}>Loading…</div>}><Insights /></Suspense> },
      { path: 'planner', element: (
        <Suspense fallback={<div style={{padding:16}}>Loading…</div>}> 
          <Planner />
        </Suspense>
      ) },
      { path: 'mindmap', element: (
        <Suspense fallback={<div style={{padding:16}}>Loading…</div>}> 
          <MindMap />
        </Suspense>
      ) },
      { path: 'assistant', element: (
        <Suspense fallback={<div style={{padding:16}}>Loading…</div>}> 
          <Assistant />
        </Suspense>
      ) },
      { path: 'sync', element: (
        <Suspense fallback={<div style={{padding:16}}>Loading…</div>}>
          <Sync />
        </Suspense>
      ) },
  { path: 'safety', element: <Safety /> },
  { path: 'vault', element: <Suspense fallback={<div style={{padding:16}}>Loading…</div>}><Vault /></Suspense> },
  { path: 'settings', element: <Suspense fallback={<div style={{padding:16}}>Loading…</div>}><Settings /></Suspense> }
    ]
  }
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
