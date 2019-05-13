import React from 'react';
import { Link } from 'react-router-dom';

import './Header.scss';

type Props = {
  showTagline: boolean;
};

function Header({ showTagline }: Props) {
  return (
    <div className="header">
      {/* <div className="icon-row mx-auto p-4 text-right">
        <a rel="noopener noreferrer" href="https://onova.co/uploader" target="_blank">
          <img alt="Uploader" width="30" height="30" src={require('../images/user.svg')} />
        </a>
      </div> */}
      <Link to="/">
        <img alt="Onova" className="my-5" src={require('../images/logo-vector.svg')} width="75" height="75" />
      </Link>
      {showTagline && <h1>Купуй та продавай одяг та аксесуари з телефону</h1>}
    </div>
  );
}

Header.defaultProps = {
  showTagline: true,
};

export default Header;
