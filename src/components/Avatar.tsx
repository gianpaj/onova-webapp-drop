import React from 'react';
import UserAvatar from 'react-user-avatar';

import { changeToHTTPS } from '../utility/Utility';

import { User } from '../types';
import './Avatar.scss';

export default ({ user }: { user: User }) => {
  if (user.profilePic) {
    const url = changeToHTTPS(user.profilePic);
    return <img className="avatar" alt="avatar" src={url} />;
  }

  return <UserAvatar size="96" className="user-avatar-inner" name={user.username} />;
};
