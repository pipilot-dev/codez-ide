// reflect-metadata must run before any class with DI decorators is loaded.
// OpenSumi modules decorated with @Injectable / @Autowired rely on it.
import 'reflect-metadata';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
