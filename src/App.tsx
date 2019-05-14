import * as Sentry from '@sentry/browser';
import React, { Component } from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';

import { isProd } from './utility/api';

import { Home, Item, NotFound, User, Uploader } from './pages';

const analyticsEnabled = isProd;

if (analyticsEnabled) {
  Sentry.init({
    dsn: 'https://df9ece2e3379459c91ce8c7518e1cb9b@sentry.io/1384442',
  });
}

export default class App extends Component {
  state = { error: null };

  componentDidCatch(error: any, errorInfo: { [x: string]: any }) {
    this.setState({ error });
    Sentry.withScope(scope => {
      Object.keys(errorInfo).forEach(key => {
        scope.setExtra(key, errorInfo[key]);
      });
      Sentry.captureException(error);
    });
  }

  render() {
    if (this.state.error) {
      return (
        <button type="button" onClick={Sentry.showReportDialog}>
          Report feedback
        </button>
      );
    }

    return (
      // for the image grid
      <div style={{ overflow: 'hidden' }}>
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
      </div>
    );
  }
}
