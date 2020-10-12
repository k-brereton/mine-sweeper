import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import {MineSweeper} from "./mine/MineSweeper";
import 'bootstrap/dist/css/bootstrap.min.css';

ReactDOM.render(
  <React.StrictMode>
      <MineSweeper />
  </React.StrictMode>,
  document.getElementById('root')
);