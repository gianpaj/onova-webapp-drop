import moment from 'moment';
import React from 'react';
import LazyLoad from 'react-lazyload';
import { Link } from 'react-router-dom';
import { Statistic } from 'antd';

import { changeToGoogleApisThumb } from '../utility/Utility';

import { Drop } from '../types';
import './DropsList.scss';

export default ({ drops }: { drops: Drop[] }) => {
  if (!drops) return null;

  const dropComponents = drops.map(drop => {
    const productComponents = drop.products.map(product => {
      const url = changeToGoogleApisThumb(product.photoURIs[0], false);
      const url2x = changeToGoogleApisThumb(product.photoURIs[0], true);
      return (
        <div key={product._id} className="col-4">
          <LazyLoad height={310} offset={100} once>
            <img alt="item" src={url} srcSet={`${url2x} 2x`} />
          </LazyLoad>
        </div>
      );
    });

    const scheduledAt = new Date(drop.scheduledAt);

    const willDropIn15Mins = moment(scheduledAt).diff(new Date(), 'minutes') < 16;

    return (
      <div key={drop.uuid} className="col-12">
        {willDropIn15Mins ? (
          <Statistic.Countdown value={scheduledAt.toString()} />
        ) : (
          <h5 className="time">{moment(scheduledAt).format('DD MMM H:mm')}</h5>
        )}
        <Link to={`/${drop.seller.username}/drop/${drop.uuid}`} className="row mx-md-auto no-gutters drop-container">
          {productComponents}
        </Link>
      </div>
    );
  });

  return <div className="row mx-md-auto no-gutters drops-list">{dropComponents}</div>;
};
