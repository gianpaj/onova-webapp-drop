import * as Sentry from '@sentry/browser';
import React, { Component } from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';

import { analyticsEnabled } from './utility/api';

import { Home, Item, NotFound, User, Uploader } from './pages';

if (analyticsEnabled) {
  Sentry.init({
    dsn: 'https://c084c69a740f4c06b4635dd9edc87656@sentry.io/1460923',
  });
} else {
  console.warn('Sentry not enabled');
}

export default class App extends Component {
  state = { error: null };

  componentDidCatch(error: any, errorInfo: { [x: string]: any }) {
    this.setState({ error });
    if (analyticsEnabled) {
      Sentry.withScope(scope => {
        Object.keys(errorInfo).forEach(key => {
          scope.setExtra(key, errorInfo[key]);
        });
        Sentry.captureException(error);
      });
    }
  }

  render() {
    if (this.state.error && analyticsEnabled) {
      return (
        <button type="button" onClick={Sentry.showReportDialog}>
          Report feedback
        </button>
      );
    }

    return (
      <Router>
        <Switch>
          <Route exact path="/" component={Home} />
          <Route exact path="/uploader" component={Uploader} />
          <Route exact path="/:userName([a-zA-Z0-9\_\.]{3,30})" component={User} />
          <Route exact path="/:userName([a-zA-Z0-9\_\.]{3,30})/:itemId([a-zA-Z0-9_-]{7,14})" component={Item} />
          <Route exact path="/:userName([a-zA-Z0-9\_\.]{3,30})/drop/:uuid([a-zA-Z0-9_-]{7,14})" component={User} />
          <Route component={NotFound} />
        </Switch>
      </Router>
    );
  }
}
