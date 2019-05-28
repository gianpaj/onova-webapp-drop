import { Pane, Spinner as EvergreenSpinner } from 'evergreen-ui';
import React from 'react';

const Spinner = ({ height = 400 }) => (
  <Pane display="flex" alignItems="center" justifyContent="center" height={height}>
    <EvergreenSpinner />
  </Pane>
);

export default React.memo(Spinner);
