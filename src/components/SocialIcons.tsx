import React from 'react';

import { User } from '../types';
import './SocialIcons.scss';

export default ({ user }: { user: User }) => {
  if (!user.socials) return null;

  const socialIcons = [];

  if (user.socials.facebook) {
    const el = (
      <a key={0} href={user.socials.facebook} role="button">
        <img src={require('../images/facebook.svg')} alt="facebook page" />
      </a>
    );
    socialIcons.push(el);
  }

  if (user.socials.instagram) {
    const el = (
      <a key={1} href={user.socials.instagram} role="button">
        <img src={require('../images/instagram.svg')} alt="instagram account" />
      </a>
    );
    socialIcons.push(el);
  }

  return <div className="socials mt-4">{socialIcons}</div>;
};
