import React from 'react';

import appStoreBadge from '../images/app-store-badge.png';
import googlePlayStore from '../images/google-play-badge.png';

import './StoreButtons.scss';

type Props = {
  classNames: string;
};

function StoreButtons({ classNames }: Props) {
  return (
    <div className={`store-buttons ${classNames}`}>
      <a
        target="_blank"
        rel="noopener noreferrer"
        href="https://play.google.com/store/apps/details?id=com.onova.app&hl=uk&referrer=utm_source%3Danypage%26utm_medium%3Dwebapp">
        <img src={googlePlayStore} alt="Download Drop on Google Play Store" />
      </a>
      <a target="_blank" rel="noopener noreferrer" href="https://itunes.apple.com/ua/app/drop/id1365771422?l=uk">
        <img src={appStoreBadge} alt="Download Drop on Apple Store" />
      </a>
    </div>
  );
}

StoreButtons.defaultProps = {
  classNames: '',
};

export default StoreButtons;
