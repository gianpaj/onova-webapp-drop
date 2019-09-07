import React from 'react';
import ReactDOM from 'react-dom';
import areIntlLocalesSupported from 'intl-locales-supported';

const localesMyAppSupports = ['uk-UA'];

if (global.Intl) {
  // Determine if the built-in `Intl` has the locale data we need.
  if (!areIntlLocalesSupported(localesMyAppSupports)) {
    // `Intl` exists, but it doesn't have the data we need, so load the
    // polyfill and patch the constructors we need with the polyfill's.
    const IntlPolyfill = require('intl');
    Intl.NumberFormat = IntlPolyfill.NumberFormat;
    Intl.DateTimeFormat = IntlPolyfill.DateTimeFormat;
  }
} else {
  // No `Intl`, so use and load the polyfill.
  global.Intl = require('intl');
}

// eslint-disable-next-line import/first
import App from './App';
// eslint-disable-next-line import/first
import './index.scss';
// import * as serviceWorker from './serviceWorker';

const rootEl = document.getElementById('root');

ReactDOM.render(<App />, rootEl);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
// serviceWorker.unregister();

// if (module.hot) {
//   module.hot.accept('./App', () => {
//     const NextApp = require('./App').default;
//     ReactDOM.render(<NextApp />, rootEl);
//   });
// }
