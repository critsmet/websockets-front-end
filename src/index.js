import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './components/App';

import { createStore } from 'redux'
import { Provider } from 'react-redux'

import { initialState, appReducer } from './redux/appReducer'

if (process.env.NODE_ENV === 'production') {
    console.log = function () {};
}

let store = createStore(appReducer, initialState)

ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
     <App />
    </Provider>
  </React.StrictMode>,
  document.getElementById('root')
);
