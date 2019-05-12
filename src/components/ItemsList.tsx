import React from 'react';
import LazyLoad from 'react-lazyload';
import { Link } from 'react-router-dom';

import { changeToGoogleApisThumb } from '../utility/Utility';

import { Product } from '../types';
import './ItemsList.scss';

type Props = {
  items: Product[];
};

function ItemsList(props: Props) {
  const { items } = props;

  if (!items) return null;

  const itemsComponents = items.map(item => {
    const url = changeToGoogleApisThumb(item.photoURIs[0], false);
    const url2x = changeToGoogleApisThumb(item.photoURIs[0], true);
    return (
      <div key={url} className="col-4">
        <Link to={`/${item.seller.username}/${item.uuid}`}>
          <LazyLoad height={'calc(100vw / 3)'} offset={200} once>
            <img alt={item.description} src={url} srcSet={`${url2x} 2x`} />
          </LazyLoad>
        </Link>
      </div>
    );
  });

  return <div className="row mx-md-auto no-gutters item-list">{itemsComponents}</div>;
}

export default ItemsList;
