import React from 'react';
import { Link } from 'react-router-dom';

import './Header.scss';

type Props = {
  showTagline: boolean;
};

function Header({ showTagline }: Props) {
  return (
    <div className="header">
      <div className="icon-row mx-auto p-4 text-right">
        <Link to="/uploader">
          <img alt="Uploader" width="30" height="30" src={require('../images/user.svg')} />
        </Link>
      </div>
      <Link to="/">
        <img alt="Drop" className="logo mt-5 mb-3" src={require('../images/logo-vector.svg')} width="75" height="75" />
      </Link>
      {showTagline && <h1>Мобільний додаток для веганської їжі та екотоварів для дому</h1>}
    </div>
  );
}

Header.defaultProps = {
  showTagline: true,
};

export default React.memo(Header);
