import React from 'react';
import { Helmet } from 'react-helmet';
import { forceCheck } from 'react-lazyload';
import { Link, RouteComponentProps } from 'react-router-dom';
import { Nav, NavItem, NavLink, Row, TabContent, TabPane } from 'reactstrap';

import { Avatar, DropsList, ItemsList, StoreButtons, SocialIcons } from '../components';
import * as api from '../utility/api';

import { Drop, Product, User as UserDoc } from '../types';
import './User.scss';

// 'gruber revised' http://rodneyrehm.de/t/url-regex.html
// const uri_pattern = /\b((?:[a-z][\w-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()[\]{};:'".,<>?«»“”‘’]))/gi;
// only match facebook and instagram urls (including without http[s])
const uri_pattern = /\b((?:[a-z][\w-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,4}[.]|[a-z0-9.-]+[.][a-z]{2,4}\/)*(facebook|instagram)(?:([^\s()<>]+)*)+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()[\]{};:'".,<>?«»“”‘’]))/gi;

interface IRouteParams {
  uuid: string;
  userName: string;
}

interface IProps extends RouteComponentProps<IRouteParams> {}

interface IState {
  drops: Drop[];
  items: Product[];
  user: UserDoc;
  activeTab: number;
}

export default class User extends React.Component<IProps, IState> {
  state = {
    activeTab: 3,
    drops: [],
    items: [] as Product[],
    user: {} as UserDoc,
  };

  componentWillMount() {
    this.fetchData();
  }

  toggle = (tab: number) => {
    if (this.state.activeTab !== tab) {
      this.setState({ activeTab: tab }, () => {
        // hack to show tabs because react-lazyload is not activated for non-active tabs
        forceCheck();
        // if (tab > -1) {
        //   window.scrollBy(0, 1);
        //   window.scrollBy(0, -1);
        // }
      });
    }
  };

  async fetchData() {
    const { userName } = this.props.match.params;

    try {
      const res = await Promise.all([
        api.get(`api/users/?username=${userName}`),
        api.get(`api/products/?username=${userName}&limit=200`),
        api.get(`api/v2/drops/?username=${userName}`),
      ]);

      // if there are no items
      if (res[1].data.length < 1) {
        // show the About tag
        this.toggle(-1);
      }

      // TODO: if there's only one category of items (accessories, etc.) set to that tab

      //#region development
      /*
      const drops = [
        {
          posted: false,
          products: [
            {
              photoURIs: [
                'https://assets.onova.co/products/8LOvCz1MR-1-1546028852413.jpg',
              ],
              _id: '5c2687346657400c3ff4567b',
            },
            {
              photoURIs: [
                'https://assets.onova.co/products/8LOvCz1MR-1-1546028852413.jpg',
              ],
              _id: '5c2687346657400c3ff4567c',
            },
            {
              photoURIs: [
                'https://assets.onova.co/products/8LOvCz1MR-1-1546028852413.jpg',
              ],
              _id: '5c2687346657400c3ff4567d',
            },
          ],
          status: 'valid',
          _id: '5c2687346657400c3ff4567a',
          scheduledAt: '2019-01-17T20:48:56.891Z',
          seller: {
            shippingAddress: {
              firstName: 'Олександр',
              lastName: 'Костінський ',
              city: 'db5c88f5-391c-11dd-90d9-001a92567626',
              departmentNovaposhta: '39931b85-e1c2-11e3-8c4a-0050568002cf',
            },
            accountStatus: 'verified',
            _id: '5afaa93daeeb1453812fc011',
            username: 'alex',
            profilePic:
              'http://assets.onova.co/users/5afaa93daeeb1453812fc011-1526385408286.jpg',
            displayName: 'Alex',
          },
          createdAt: '2018-12-28T20:27:32.932Z',
          updatedAt: '2018-12-28T20:27:32.932Z',
          uuid: 'yAyE262fS',
        },
      ];
      */
      //#endregion

      this.setState({
        user: res[0],
        items: res[1].data,
        drops: res[2].data,
        // drops: drops,
      });

      if (this.props.match.params.uuid) {
        this.toggle(4);
      }
    } catch (error) {
      // redirect to homepage
      this.props.history.push('/');
      console.error(error);
    }
  }

  render() {
    const { drops, user, items, activeTab } = this.state;

    if (!drops || !Object.keys(user).length || !items) return null;

    const clothingItems = items.filter(i => i.categoryIds[0] === 0);
    const shoesItems = items.filter(i => i.categoryIds[0] === 1);
    const otherItems = items.filter(i => i.categoryIds[0] === 2);

    let bio;
    if (user.bio) bio = user.bio.replace(uri_pattern, '').trim();

    return (
      <React.Fragment>
        <Helmet title={(user.displayName || `@${user.username}`) + ' shop'} />
        <div className="user-page">
          <Nav tabs className="d-inline-flex mb-5">
            <NavItem className="px-sm-3">
              {/* eslint-disable react/jsx-no-bind */}
              <NavLink className={activeTab === -1 ? 'active' : ''} onClick={() => this.toggle(-1)}>
                Бренд
              </NavLink>
            </NavItem>
            {clothingItems.length > 0 && (
              <NavItem className="px-sm-3">
                <NavLink className={activeTab === 0 ? 'active' : ''} onClick={() => this.toggle(0)}>
                  Одяг
                </NavLink>
              </NavItem>
            )}
            {shoesItems.length > 0 && (
              <NavItem className="px-sm-3">
                <NavLink className={activeTab === 1 ? 'active' : ''} onClick={() => this.toggle(1)}>
                  Взуття
                </NavLink>
              </NavItem>
            )}
            {otherItems.length > 0 && (
              <NavItem className="px-sm-3">
                <NavLink className={activeTab === 2 ? 'active' : ''} onClick={() => this.toggle(2)}>
                  Аксесуари
                </NavLink>
              </NavItem>
            )}
            {drops.length > 0 && (
              <NavItem className="px-sm-3">
                <NavLink className={activeTab === 4 ? 'active' : ''} onClick={() => this.toggle(4)}>
                  Анонси
                </NavLink>
              </NavItem>
            )}
            <NavItem
              style={{
                border: 0,
                height: '4em',
                left: 0,
                position: 'absolute',
                right: 0,
                top: 40,
              }}
              className="pt-1 px-0 px-sm-3">
              {/* activeTab 3 */}
              <NavLink onClick={() => this.toggle(3)}>
                {/* eslint-enable react/jsx-no-bind */}
                <h1 className="text-truncate" style={{ textTransform: 'initial' }}>
                  {user.displayName || user.username}
                </h1>
              </NavLink>
            </NavItem>
          </Nav>
          <TabContent activeTab={activeTab}>
            <TabPane tabId={-1}>
              <div className="px-5 user-data">
                <Row noGutters>
                  <div className="col">
                    <p className="bio lead text-left mb-0">{bio}</p>
                    <SocialIcons user={user} />
                    <Row noGutters className="my-4">
                      <Avatar user={user} />
                      <div className="username my-auto ml-3">
                        <p className="lead mb-0">{`@${user.username}`}</p>
                      </div>
                    </Row>
                    <StoreButtons classNames="text-left no-gutters" />
                  </div>
                </Row>
                {/* <Row noGutters>
                  <div className="col">
                    <StoreButtons
                      vertical
                      classNames="d-inline-flex"
                    />
                  </div>
                </Row> */}
              </div>
            </TabPane>
            <TabPane tabId={0}>{clothingItems.length > 0 && <ItemsList items={clothingItems} />}</TabPane>
            <TabPane tabId={1}>{shoesItems.length > 0 && <ItemsList items={shoesItems} />}</TabPane>
            <TabPane tabId={2}>{otherItems.length > 0 && <ItemsList items={otherItems} />}</TabPane>
            <TabPane tabId={3}>
              <ItemsList items={items} />
            </TabPane>
            <TabPane tabId={4}>{drops.length > 0 && <DropsList drops={drops} />}</TabPane>
          </TabContent>

          <footer className="py-3" />
          {activeTab !== -1 && (
            <footer className="py-5">
              <Link to="/">
                <img className="logo" alt="Drop" src={require('../images/logo-vector.svg')} width="75" height="75" />
              </Link>
            </footer>
          )}
        </div>
      </React.Fragment>
    );
  }
}
