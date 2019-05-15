import React from 'react';

import { addBreadcrumb } from '@sentry/browser';
import { toaster } from 'evergreen-ui';
import Flickity from 'react-flickity-component';
import { Helmet } from 'react-helmet';
import { Link, RouteComponentProps } from 'react-router-dom';
import { Button } from 'reactstrap';

import { Avatar, CheckoutSidebar, StoreButtons } from '../components';
import * as api from '../utility/api';
import { changeToHTTPS, formatCurrency } from '../utility/Utility';

import { Product } from '../types';
import './Item.scss';

require('flickity-fullscreen');

type RouteParams = {
  itemId: string;
  userName: string;
};

interface IProps extends RouteComponentProps<RouteParams> {}
interface IState {
  currentSlide: number;
  isSideBarVisible: boolean;
  item: Product;
}

class Item extends React.Component<IProps, IState> {
  state = {
    currentSlide: 0,
    isSideBarVisible: false,
    item: {} as Product,
  };
  // loadFreshChat();

  componentDidMount() {
    this.fetchData()
      .then(data => this.setState({ item: data }))
      .catch(error => {
        // redirect to homepage
        this.props.history.push('/');
        console.error(error);
      });
  }

  fetchData = async () => {
    const result = await api.getProduct(this.props.match.params.itemId);
    if (result.seller.username !== this.props.match.params.userName) {
      throw new Error('wrong username');
    }
    return result;
  };

  onBuy = async () => {
    const { item } = this.state;
    try {
      const product = await api.getProduct(item.uuid);
      if (product.status !== 'forsale') {
        if (product.status === 'reserved') {
          throw Error('Перевір через 15хв, товар може бути доступний');
        }
        throw Error('Цю річ вже продано');
      }
      this.setState({ isSideBarVisible: true });
    } catch (error) {
      toaster.danger(error.message);
    }
    addBreadcrumb({
      data: {
        uuid: item.uuid,
      },
      message: 'onBuy',
    });
  };

  setSideBarVisibility = (val: boolean) => this.setState({ isSideBarVisible: val });

  render() {
    const { history } = this.props;
    const { item, isSideBarVisible } = this.state;

    if (!Object.keys(item).length) return null;

    const slides = item.photoURIs.map((photo, i) => {
      const url = changeToHTTPS(photo);
      return <img key={photo} data-flickity-lazyload={url} alt="" />;
    });

    return (
      <div className="item-page">
        <Helmet title={(item.seller.displayName || `@${item.seller.username}`) + ' shop'} />
        <header className="mx-auto">
          <div className="title">
            <Link className="nav-link" to={`/${item.seller.username}`}>
              <h1 className="text-truncate">{item.seller.displayName || item.seller.username}</h1>
            </Link>
          </div>
          <div className="row no-gutters mb-4">
            <div className="col">
              {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
              <a tabIndex={0} role="link" onKeyPress={history.goBack} onClick={history.goBack}>
                <img className="back-arrow" src={require('../images/back.svg')} alt="go back" />
              </a>
            </div>
          </div>
        </header>
        <div className="row no-gutters justify-content-md-center">
          <div className="col-12 col-sm-6">
            <Flickity
              className="carousel mb-3 mx-auto"
              options={{
                arrowShape: {
                  x0: 10,
                  x1: 60,
                  x2: 65,
                  x3: 15,
                  y1: 50,
                  y2: 50,
                },
                fullscreen: true,
                initialIndex: 0,
                lazyLoad: 1,
                pageDots: slides.length > 1,
                prevNextButtons: slides.length > 1,
                setGallerySize: false,
                wrapAround: true,
              }}>
              {slides}
            </Flickity>
          </div>
          <div
            className={`col-12 col-md-4 col-sm-6 mt-5 mt-sm-0 ${
              item.photoURIs.length > 1 ? 'text-align-multiple' : 'text-align-one'
            }`}>
            <p className="lead">{item.description}</p>
            <p className="lead price">{formatCurrency(parseFloat(item.price), 0)} ₴</p>
            <Button size="lg" color="danger" onClick={this.onBuy}>
              Придбати
              {/* Buy */}
            </Button>
            <Link to={`/${item.seller.username}`}>
              <div className="row no-gutters my-4">
                <Avatar user={item.seller} />
                <div className="my-auto ml-3 username">
                  <p className="lead mb-0">@{item.seller.username}</p>
                </div>
              </div>
            </Link>
            <StoreButtons classNames="text-left no-gutters" />
          </div>
        </div>
        <footer className="py-5" />
        <footer className="py-3" />
        {isSideBarVisible && (
          // eslint-disable-next-line react/jsx-no-bind
          <CheckoutSidebar itemUuid={item.uuid} onToggleSidebar={() => this.setSideBarVisibility(false)} />
        )}
      </div>
    );
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function loadFreshChat(src: any) {
  const tag = document.createElement('script');
  tag.async = false;
  tag.addEventListener('load', () => {
    // @ts-ignore:disable-line
    window.fcWidget.init({
      config: {
        content: {
          placeholders: {
            csat_reply: 'Add your comments here',
            reply_field: 'Reply',
            search_field: 'Search',
          },
        },
      },
      host: 'https://wchat.freshchat.com',
      locale: 'uk',
      token: '***REMOVED***',
    });
  });
  tag.src = 'https://wchat.freshchat.com/js/widget.js';
  document.getElementsByTagName('body')[0].appendChild(tag);
}

export default Item;
