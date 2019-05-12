import React from 'react';

import './NotFound.scss';

export default ({ location }: { location: any }) => (
  <div className="not-found-container align-items-center d-flex flex-column justify-content-center not-found-container">
    <h3>
      {'No match for '}
      <code>{location.pathname}</code>
    </h3>
    <video autoPlay loop width="50%">
      <source src={require('../images/404.mp4')} type="video/mp4" />
    </video>
    <div className="shadowVideo" />
  </div>
);
