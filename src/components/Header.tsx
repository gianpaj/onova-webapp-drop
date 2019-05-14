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
        <img alt="Drop" className="my-5" src={require('../images/logo-vector.svg')} width="75" height="75" />
      </Link>
      {showTagline && <h1>Купуй та продавай одяг та аксесуари з телефону</h1>}
    </div>
  );
}

Header.defaultProps = {
  showTagline: true,
};

export default Header;
