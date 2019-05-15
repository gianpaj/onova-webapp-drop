import React from 'react';
import store from 'store';
import moment from 'moment';
import { Button, message, Icon, Spin, Alert, Table } from 'antd';
import update from 'immutability-helper';
import * as Sentry from '@sentry/browser';

import './Uploader.scss';

// import FacebookAuth from 'react-facebook-auth';

import Header from '../components/uploader/Header';
import ItemUploader from '../components/uploader/ItemUploader';
import Login from '../components/uploader/Login';

import * as api from '../utility/api';

// declare var VK;

declare global {
  interface Window {
    APP_ID: string;
    Intercom: any;
  }
}

const isProd = document.location.hostname === 'drop.uno';

// const TIMEOUT_MESSAGE = 10 * 1000; // 10 seconds
// const VK_TIMEOUT_MESSAGE = 10 * 1000; // 10 seconds
// const VK_API_VERSION = "5.78";
// const VK_CLIENT_ID = "6614680";

// const notify = 1;
// const photos = 4;
// const wall = 8192;
// const offline = 65536; // Access to API at any time
// const scope = wall + photos;

let lastItemId = -1;

const columns = [
  {
    title: 'Фото',
    dataIndex: 'photoURIs',
    key: 'photoURIs',
    render: (photoURIs: Array<string>) => (
      <img style={{ width: 50, height: 50 }} src={photoURIs[0].replace('.jpg', '-thumb.jpg')} alt="thumb" />
    ),
  },
  {
    title: 'Статус',
    dataIndex: 'lastFinishedAt',
    key: 'lastFinishedAt',
    render: (lastFinishedAt: Date) => <span>{lastFinishedAt ? 'Виставлено' : 'Заплановано'}</span>,
  },
  {
    title: 'Запланований час',
    dataIndex: 'nextRunAt',
    key: 'nextRunAt',
    render: (nextRunAt: string) => (
      <span>
        {moment(nextRunAt)
          .utcOffset(-new Date().getTimezoneOffset())
          .format('DD-MM-YYYY h:mm:ss a')}
      </span>
    ),
  },
];

export type Item = {
  id: string;
  categoryIds: number;
  description: string;
  photos: Array<any>;
  price: string;
  ready: boolean;
  tags: Array<any>;
  tagsText: string;
  typeIds: number;
  // uploaded: boolean,
};

type State = {
  emailAddress: string;
  errMsg: string;
  // FBToken: string,
  hasError: boolean;
  hasException: boolean;
  isLoggedIn: boolean;
  items: Array<Item>;
  loading: boolean;
  location: {
    longitude: number;
    latitude: number;
  };
  password: string;
  pending: boolean;
  // shareOnFB: boolean,
  shareOnVK: boolean;
  scheduled: any;
  token: string;
  userData: any;
  view: string;
};

Sentry.init({
  dsn: 'https://2f2f34d35cbd45e0b5c1b8056b00daeb@sentry.io/1340177',
  enabled: isProd,
});

export default class Uploader extends React.Component {
  state = {
    emailAddress: '',
    errMsg: '',
    // FBToken: '',
    hasError: false,
    hasException: false,
    isLoggedIn: false,
    items: [] as Array<Item>,
    loading: false,
    location: {} as any,
    password: '',
    pending: false,
    // shareOnFB: true,
    scheduled: undefined,
    shareOnVK: false,
    token: '',
    userData: null as any,
    view: 'posting',
  };

  componentDidMount() {
    const userData = store.get('user');
    const token = store.get('token') || '';
    if (userData) {
      this.setupOneEmptyListing();
      this.setState(
        {
          loading: true,
          userData,
          token,
        },
        () => this.refreshUser()
      );
    }
  }

  componentDidCatch(error: any, errorInfo: any) {
    this.setState({ hasException: error });
    Sentry.withScope(scope => {
      Object.keys(errorInfo).forEach(key => {
        scope.setExtra(key, errorInfo[key]);
      });
      Sentry.captureException(error);
    });
  }

  // initVKOpenAPI() {
  //   return this.canWeAccessVK()
  //     .then(this.loadVKOpenAPI)
  //     .then(() => VK.init({ apiId: VK_CLIENT_ID }));
  // }

  // canWeAccessVK(): Promise<void> {
  //   return new Promise((resolve, reject) => {
  //     var image = new Image();

  //     image.onerror = () => reject();
  //     image.onload = () => resolve();

  //     image.src = "https://vk.com/favicon.ico?" + +new Date();
  //     setTimeout(() => {
  //       if (!image.complete || !image.naturalWidth) {
  //         reject();
  //       }
  //     }, VK_TIMEOUT_MESSAGE);
  //   });
  // }

  // loadVKOpenAPI(): Promise<void> {
  //   return new Promise((resolve, reject) => {
  //     const script = document.createElement("script");

  //     script.src = "//vk.com/js/api/openapi.js";
  //     script.async = true;
  //     document.body.appendChild(script);

  //     script.onerror = () => reject();
  //     script.onload = () => resolve();
  //   });
  // }

  // handleFacebookAuth = async (response: any) => {
  //   const { token, userData } = this.state;
  //   const {
  //     accessToken,
  //     userID,
  //     expiresIn,
  //     // access tokens need to be renewed every 90 days
  //     reauthorize_required_in, // seconds
  //   }: {
  //     accessToken: string;
  //     userID: string;
  //     expiresIn: number;
  //     reauthorize_required_in: string;
  //   } = response;
  //   console.log(accessToken, userID, expiresIn, reauthorize_required_in);
  //   console.log(response);

  //   // Api call to server so we can validate the token
  //   try {
  //     await api.put(
  //       `/api/users/${userData._id}`,
  //       {
  //         facebook: userID,
  //         accessToken: accessToken,
  //       },
  //       { token }
  //     );
  //     // store.set('FBToken', accessToken);
  //     // this.setState({ FBToken: accessToken });
  //   } catch (err) {
  //     if (err.message === 'Duplicate facebook id') {
  //       message.destroy();
  //       message.error('This Facebook user already connect to an Drop user.');
  //     }
  //     console.error(err);
  //   }
  // };

  onLogin = (emailAddress: string, password: string): Promise<any> | void => {
    if (!emailAddress || !password) return;

    return api
      .post('/api/auth/login', {
        emailAddress: emailAddress,
        password: password,
      })
      .then(res => {
        if (res.data) {
          return res;
        }
        console.debug(res);
        throw new Error(res);
      })
      .then(({ data, token }) => {
        store.set('user', data);
        store.set('token', token);
        return { userData: data, token };
      })
      .then(async ({ userData, token }) => {
        this.setState({
          userData,
          token,
        });
        this.setupOneEmptyListing();

        return this.refreshUser();
      })
      .catch((err: any) => {
        if (err.status !== 401) console.error(err);
        message.error(err.message, 2);
      });
  };

  loadIntercom(userData: any) {
    if (isProd) {
      window.Intercom('boot', {
        app_id: window.APP_ID,
        accountStatus: userData.accountStatus,
        email: userData.emailAddress,
        followersCount: userData.followersCount,
        followingCount: userData.followingCount,
        username: userData.username,
        user_id: userData._id,
        usingUploader: true,
        created_at: parseInt((new Date(userData.createdAt).getTime() / 1000).toFixed(0), 10),
      });
    }
  }

  setupOneEmptyListing = () => {
    lastItemId++;
    const formData = {
      id: `id-${lastItemId}`,
      ready: false,
    };
    this.setState({ items: [formData] });
  };

  canCreateDrop(userData: any) {
    const { mobileNumber, paymentInfo: p, shippingAddress: s } = userData;
    return (
      mobileNumber &&
      ((p.short && p.short.last_four) || (p.long && p.long.last_four)) &&
      s.firstName &&
      s.lastName &&
      s.city &&
      s.departmentNovaposhta
    );
  }

  refreshUser = async (): Promise<any> => {
    const { token, userData } = this.state;
    if (!userData) return;
    try {
      const body = await api.get(`/api/users/${userData._id}/personal`, {
        token,
      });
      if (!this.canCreateDrop(body)) {
        // Before uploading items and creating drops, please enter you shipping and card details on the mobile app
        throw new Error(
          'Будь ласка додайте спочатку інформацію щодо вашого відділення нової пошти і на яку картку мають зараховуватися кошти в налаштування'
        );
      }

      Sentry.configureScope(scope => {
        scope.setUser({
          email: userData.emailAddress,
          userID: userData._id,
          username: userData.username,
          extra: {
            accountStatus: userData.accountStatus,
          },
        });
      });

      // if (body.facebook) {
      //   const accessToken = body.tokens.find(t => t.kind === 'fb').accessToken;
      //   if (accessToken) {
      //     store.set('FBToken', accessToken);
      //     this.setState({ FBToken: accessToken });
      //   }
      // const VKaccessToken = body.tokens.find(t => t.kind === 'vk');
      // if (VKaccessToken && VKaccessToken.accessToken) {
      //   this.setState({ VKTokenSaved: true });
      // }
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          console.debug(coords);
          this.setState({
            location: {
              longitude: coords.longitude,
              latitude: coords.latitude,
            },
            isLoggedIn: true,
            loading: false,
            hasError: false,
          });
          this.loadIntercom(body);
        },
        e => {
          console.error(e);
          this.alertForPermission();
          this.setState({ errMsg: 'No location permission', hasError: true });
        },
        { enableHighAccuracy: false, maximumAge: 10000 }
      );
      return null;
    } catch (err) {
      console.error(err);
      if (err.message === 'Invalid user') {
        this.onLogout();
        this.setState({ loading: false });
        return err;
      }
      this.setState({ errMsg: err.message, hasError: true });
      return err;
    }
  };

  alertForPermission() {
    message.error(
      'Нам потрібен доступ до твого місцезнаходження щоб відображати твоє місто в додатку. Після погодження перезавантаж сторінку.',
      10
    );
  }

  onLogout = () => {
    this.setState({ isLoggedIn: false });
    store.clearAll();
    if (isProd) {
      window.Intercom('shutdown');
    }
  };

  onUploadAndAnnounce = async (date: moment.Moment, time: moment.Moment, announcement: string) => {
    const { items, shareOnVK /*, userData*/ } = this.state;
    this.setState({ pending: true });
    // let loadingMsg;
    date.hour(time.hour());
    date.minute(time.minute());

    const itemsReady = items.filter(i => i.ready === true);

    // 2. Schedule to Drop
    this.uploadToDrop(date, time)
      .then(() => {
        if (!shareOnVK) {
          // `${itemsReady.length} listing(s) scheduled successfully to Drop.`
          message.success(`${itemsReady.length} речей заплановано успішно. Вони будуть автоматично виставлені`);
        }
        this.setState({ pending: false });
        this.clearItems();
      })
      .catch(e => {
        console.error(e);
        message.error('Завантаження в Drop обірвалось');
        this.setState({ pending: false });
      });

    if (!shareOnVK) {
      // return message.loading(`Scheduling ${itemsReady.length} items to Drop`);
      return message.loading(`Завантажуємо ${itemsReady.length} речей в Drop`);
    }
    //     const timeoutID = setTimeout(() => {
    //       loadingMsg();
    //       message.error("Помилка при завантаженні речей");
    //     }, TIMEOUT_MESSAGE);

    //     // 3. Schedule wall post to VK
    //     loadingMsg = message.loading(
    //       // `Scheduling ${itemsReady.length} items to Drop and VK`,
    //       `Завантажуємо спланованих ${itemsReady.length} речей в Онову та ВК`,
    //       0
    //     );
    //     VK.Auth.getLoginStatus(res => {
    //       const ownerId = res.session.mid;
    //       // const accessToken = res.session.sid;

    //       VK.Api.call(
    //         "photos.getWallUploadServer",
    //         { v: VK_API_VERSION },
    //         async r => {
    //           clearTimeout(timeoutID);
    //           try {
    //             if (!r.response) throw r;

    //             for (let i = 0; i < itemsReady.length; i++) {
    //               const item = itemsReady[i];

    //               // Array of `photos` JSON object from VK
    //               const { data } = await this.uploadPhotosOfOneItemToVKViaDrop(
    //                 r.response.upload_url,
    //                 item
    //               );
    //               // add link to seller Onova's profile
    //               const sellerURL = `onova.co/${userData.username}`;
    //               const msg = `${item.description}

    // ${item.price} грн

    // ${sellerURL}`;
    //               console.debug(msg);
    //               const post = await this.makeVKWallPost(msg, date, ownerId, data);

    //               if (post.post_id) {
    //                 const postURL = `https://vk.com/wall${ownerId}_${post.post_id}`;
    //                 console.debug(postURL);
    //                 message.success(
    //                   <span>
    //                     Ось твій пост :{" "}
    //                     <a target="_blank" rel="noopener noreferrer" href={postURL}>
    //                       {postURL}
    //                     </a>
    //                   </span>,
    //                   2
    //                 );
    //               }
    //             }
    //             this.setState({ pending: false });
    //             loadingMsg();
    //             // return window.location.reload();
    //             this.clearItems();
    //           } catch (err) {
    //             console.error(err);
    //             this.setState({ pending: false });
    //             loadingMsg();
    //             message.error("Не має доступу до ВК");
    //           }
    //         }
    //       );
    //     });
  };

  clearItems = () => this.setState({ items: [] });

  // makeVKWallPost(
  //   message: string,
  //   date: moment.Moment,
  //   ownerId: string,
  //   photos: Array<any>
  // ) {
  //   let promises = photos.map(photo => {
  //     return new Promise((resolve, reject) => {
  //       VK.Api.call(
  //         "photos.saveWallPhoto",
  //         {
  //           hash: photo.hash,
  //           photo: photo.photo,
  //           server: photo.server,
  //           v: VK_API_VERSION,
  //         },
  //         r => {
  //           if (r.error) return reject(r.error);

  //           const photoId = r.response[0].id;
  //           resolve(photoId);
  //         }
  //       );
  //     });
  //   });
  //   return new Promise((resolve, reject) => {
  //     Promise.all(promises).then(photoIds => {
  //       console.debug(photoIds);
  //       const attachments = photoIds.map(pId => `photo${ownerId}_${pId}`);
  //       console.debug(attachments);
  //       VK.Api.call(
  //         "wall.post",
  //         {
  //           message,
  //           publish_date: date.unix(),
  //           attachments: attachments.join(","),
  //         },
  //         r => {
  //           if (r.response) return resolve(r.response);
  //           // reject(r.error);
  //           resolve(r.error);
  //         }
  //       );
  //     });
  //   });
  // }

  /**
   * For each item we send the list of URLs to be uploaded to VK
   */
  // uploadPhotosOfOneItemToVKViaDrop(upload_url: string, item: Item): Promise<any> {
  //   const { token } = this.state;
  //   return api.post(
  //     '/api/photos/upload-to-vk',
  //     {
  //       upload_url,
  //       photos: item.photos,
  //     },
  //     { token }
  //   );
  // }

  uploadToDrop = async (date: moment.Moment, time: moment.Moment) => {
    const { items, token, location } = this.state;

    let itemsReady: any = items.filter(i => i.ready === true);

    date.hour(time.hour());
    date.minute(time.minute());

    itemsReady = itemsReady.map((product: any) => {
      // eslint-disable-next-line no-unused-vars
      const { id, ready, ...rest } = product;
      return rest;
    });

    const formData = {
      date,
      products: itemsReady,
      latitude: location.latitude.toString(),
      longitude: location.longitude.toString(),
    };

    try {
      await api.post('/api/v2/drops', formData, {
        token,
        timeout: 20000,
      });
    } catch (err) {
      return err;
    }
  };

  addItem = (formData: Item) => {
    this.setState((prevState: State) => {
      const i = prevState.items.map(e => e.id).indexOf(formData.id);
      formData.ready = true;
      return {
        items: update(prevState.items, { [i]: { $set: formData } }),
      };
    });
  };

  addEmptyItem = () => {
    lastItemId++;
    const formData = {
      id: `id-${lastItemId}`,
      ready: false,
    };
    this.setState({ items: [...this.state.items, formData] });
  };

  onDeleteItem = (id: string) => {
    // lastItemId--;
    const newItems = this.state.items.filter(item => item.id !== id);
    if (newItems.length === 0) {
      return this.setupOneEmptyListing();
    }
    this.setState({ items: newItems });
  };

  // toggleVKCheckbox = (): Promise<any> => {
  //   const { shareOnVK } = this.state;
  //   // if enabled it, disable
  //   if (shareOnVK) return this.setState({ shareOnVK: false });
  //   return this.initVKOpenAPI()
  //     .then(this.loginToVK)
  //     .then(() => this.setState({ shareOnVK: true }))
  //     .catch(e => {
  //       console.error(e);
  //       message.error(
  //         (e && e.message) ||
  //           "Не можемо підєднатись до ВК, переконайся що ти увімкнув впн"
  //       );
  //       throw e;
  //       // this.setState({ shareOnVK: false });
  //     });
  // };

  // loginToVK() {
  //   return new Promise((resolve, reject) => {
  //     VK.Auth.getLoginStatus(res => {
  //       console.debug(res);
  //       if (res.status === "connected") {
  //         console.debug("already logged in - we can share on VK");
  //         return resolve();
  //       }

  //       console.debug("logging into VK");
  //       VK.Auth.login(res => {
  //         if (res.status !== "connected") {
  //           // no access to VK - user closed the login popup or it was blocked
  //           // TODO: improve error message
  //           reject(new Error("Не має доступу до ВК"));
  //           return;
  //         }
  //         console.debug("logged in successfully - we can share on VK");
  //         resolve();
  //       }, scope);
  //     });
  //   });
  // }

  toggleView = (view: string) => {
    this.setState({ view });
    view === 'scheduled' && this.getScheduled();
  };

  getScheduled = async () => {
    const { token, userData } = this.state;
    try {
      const { data } = await api.get(`/api/v2/drops/?username=${userData.username}`, {
        token,
      });
      let scheduled = [];
      // get each product of each drop
      for (let j = 0; j < data.length; j++) {
        const drop = data[j];
        for (let i = 0; i < drop.products.length; i++) {
          const prod = drop.products[i];
          scheduled.push({ ...prod, key: j++ });
        }
      }
      this.setState({ scheduled });
    } catch (err) {
      message.destroy();
      message.error(err);
      console.error(err);
    }
  };

  renderItems = () => {
    const { items, token } = this.state;
    return (
      <div className="items">
        {items.map(item => (
          <div key={item.id} style={{ width: '25vw', padding: 10, minHeight: 410 }}>
            <ItemUploader
              id={item.id}
              addItem={this.addItem}
              // eslint-disable-next-line react/jsx-no-bind
              onDeleteItem={() => this.onDeleteItem(item.id)}
              token={token}
            />
          </div>
        ))}
        <div
          style={{
            width: '25vw',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 410,
            padding: 20,
            display: 'flex',
          }}>
          <Button onClick={this.addEmptyItem} style={{ borderWidth: 0, backgroundColor: 'transparent' }}>
            <Icon type="plus" style={{ fontSize: 32 }} />
          </Button>
        </div>
      </div>
    );
  };

  renderScheduled = () => (
    <Table
      dataSource={this.state.scheduled}
      columns={columns}
      pagination={false}
      locale={{
        filterConfirm: 'Ok',
        filterReset: 'Reset',
        // emptyText: 'No Scheduled Drops',
        emptyText: 'Немає запланованих Дропів',
      }}
    />
  );

  render() {
    const {
      errMsg,
      hasError,
      hasException,
      isLoggedIn,
      items,
      loading,
      pending,
      // shareOnVK,
      userData,
      view,
    } = this.state;

    if (hasError) {
      return (
        <div
          style={{
            alignItems: 'center',
            display: 'flex',
            flex: 1,
            flexDirection: 'column',
            justifyContent: 'center',
          }}>
          <Alert message="Error" description={errMsg} type="error" showIcon />
          {errMsg === 'No location permission' ? (
            // eslint-disable-next-line react/jsx-no-bind
            <Button onClick={() => window.location.reload()} style={{ marginTop: 20 }} icon="reload">
              Reload
            </Button>
          ) : (
            <Button
              // eslint-disable-next-line react/jsx-no-bind
              onClick={() => {
                this.onLogout();
                this.setState({ hasError: false });
              }}
              style={{ marginTop: 20 }}
              icon="logout">
              Вийти
            </Button>
          )}
          {/* eslint-disable-next-line react/jsx-no-bind */}
          {hasException && <button onClick={() => Sentry.showReportDialog()}>Report feedback</button>}
        </div>
      );
    }

    if (loading) {
      return (
        <div
          style={{
            alignItems: 'center',
            display: 'flex',
            flex: 1,
            justifyContent: 'center',
            height: '100vh',
          }}>
          <Spin indicator={<Icon type="loading" style={{ fontSize: 54 }} spin />} />
        </div>
      );
    }

    if (!isLoggedIn) return <Login onLogin={this.onLogin} />;

    const haveWeAddedItems = items.filter(i => i.ready === true).length > 0;

    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Header
          haveWeAddedItems={haveWeAddedItems}
          onLogout={this.onLogout}
          onUploadAndAnnounce={this.onUploadAndAnnounce}
          pending={pending}
          refreshUser={this.refreshUser}
          // shareOnVK={shareOnVK}
          // toggleVKCheckbox={this.toggleVKCheckbox}
          toggleView={this.toggleView}
          view={view}
          userData={userData}
        />
        <div style={{ backgroundColor: '#ECECEC', flex: 1 }}>
          <div style={view === 'posting' ? {} : { display: 'none' }}>{this.renderItems()}</div>
          <div style={view === 'posting' ? { display: 'none' } : {}}>{this.renderScheduled()}</div>
        </div>
      </div>
    );
  }
}
