import React from 'react';
import Row from 'reactstrap/lib/Row';
import Col from 'reactstrap/lib/Col';
import Container from 'reactstrap/lib/Container';
import { Button, DatePicker, Popover, TimePicker, Select } from 'antd';
import moment from 'moment';

import './Header.scss';

// const FacebookButton = ({ onClick }) => (
//   <Button onClick={onClick} type="primary">
//     Connect with Facebook
//   </Button>
// );

type Props = {
  onUploadAndAnnounce: (date: moment.Moment, time: moment.Moment, announcement: string) => Promise<void>;
  onLogout: () => void;
  refreshUser: () => Promise<null | Error>;
  // toggleVKCheckbox: () => void,
  toggleView: (view: string) => void;
  userData: any;
  haveWeAddedItems: boolean;
  pending: boolean;
  // shareOnVK: boolean,
  view: string;
};

type State = {
  announcement: string;
  // enablingShakeOnVK: boolean,
  date: moment.Moment;
  time: moment.Moment;
};

class Header extends React.Component<Props, State> {
  state = {
    announcement: '',
    // enablingShakeOnVK: false,
    date: moment(new Date()),
    time: moment(new Date()),
  };

  shouldComponentUpdate(nextProps: Props, nextState: State) {
    return (
      nextProps.haveWeAddedItems !== this.props.haveWeAddedItems ||
      // nextProps.shareOnVK !== this.props.shareOnVK ||
      nextProps.pending !== this.props.pending ||
      nextProps.view !== this.props.view ||
      // nextState.enablingShakeOnVK !== this.state.enablingShakeOnVK ||
      nextState.date !== this.state.date ||
      nextState.time !== this.state.time
    );
  }

  onDateChange = (date: moment.Moment) => this.setState({ date });

  onTimeChange = (time: moment.Moment) => this.setState({ time });

  onChangeAnnouncement = (announcement: string) => this.setState({ announcement });

  // toggleFBCheckbox = () => this.setState({ shareOnFB: !this.state.shareOnFB });

  disabledDate(current: moment.Moment | undefined) {
    // allow empty select
    if (!current) return false;

    const date = moment();
    date.hour(0);
    date.minute(0);
    date.second(0);
    return current.valueOf() < date.valueOf(); // cannot select days before today
  }

  // toggleVKCheckbox = async () => {
  //   this.setState({ enablingShakeOnVK: true });
  //   try {
  //     await this.props.toggleVKCheckbox();
  //   } catch (error) {}
  //   this.setState({ enablingShakeOnVK: false });
  // };

  render() {
    const {
      announcement,
      date,
      time,
      // enablingShakeOnVK,
      // FBToken,
      // shareOnFB,
    } = this.state;

    const {
      haveWeAddedItems,
      pending,
      // shareOnVK,
      toggleView,
      userData,
      view,
    } = this.props;

    const isUploadingEnable = haveWeAddedItems && date && time;
    const isPostingEnabled = view === 'posting';

    return (
      <div style={{ marginBottom: 20 }}>
        <Container fluid>
          <Row style={{ alignItems: 'center', paddingBottom: 10, paddingTop: 20 }}>
            <Col>
              <img
                style={{
                  width: 30,
                  height: 30,
                  marginRight: 10,
                }}
                src={require('../../images/icon-150px.png')}
                alt="onova logo"
              />
              <span>@{userData.username}</span>
            </Col>
            <Col xs style={{ textAlign: 'right' }}>
              <Popover
                arrowPointAtCenter
                placement="left"
                content={
                  <Button icon="logout" onClick={this.props.onLogout}>
                    Вийти
                  </Button>
                }>
                <Button
                  icon="ellipsis"
                  ghost
                  style={{ border: 0, fontSize: 16, color: 'black' }}
                  size="large"
                  className="more-button"
                />
              </Popover>
            </Col>
          </Row>

          <Row>
            <Col xs={8} className="align-items-center d-flex">
              <DatePicker
                disabled={!isPostingEnabled}
                disabledDate={this.disabledDate}
                onChange={this.onDateChange}
                placeholder="Дата"
                style={{ width: 136 }}
                value={date}
              />
              <TimePicker
                className="ml-2"
                disabled={!isPostingEnabled}
                format="HH:mm"
                onChange={this.onTimeChange}
                placeholder="Час"
                style={{ width: 100 }}
                value={time}
              />
              {/* {FBToken === '' ? (
                <FacebookAuth
                  appId="401595673676305"
                  callback={this.handleFacebookAuth}
                  component={FacebookButton}
                  fields="name,email,publish_actions"
                  onFailure={err => {
                    console.error(err);
                  }}
                  returnScopes
                  // version={'2.8'}
                  language="uk"
                />
              ) : (
                <View>
                  <Checkbox
                    onChange={this.toggleFBCheckbox}
                    checked={shareOnFB}>
                    Share on Facebook
                  </Checkbox>
                </View>
              )} */}
              {/* <div className="d-inline-flex ml-3"> */}
              {/* TODO: disable checkbox while isAuthenticatingWithVK */}
              {/* <Switch
                  onChange={this.toggleVKCheckbox}
                  checked={shareOnVK}
                  loading={enablingShakeOnVK}
                  checkedChildren="ВК"
                  unCheckedChildren="ВК"
                />
                <p className="ml-1 ant-checkbox-wrapper">
                  запостити в вк (увімкніть впн перед натисканням)
                </p> */}
              {/* </div> */}
            </Col>
            <Col xs={4} className="text-right">
              <Select
                defaultValue="posting"
                // style={{ width: 140 }}
                onChange={toggleView}>
                <Select.Option value="posting">Завантажити</Select.Option>
                <Select.Option value="scheduled">Заплановані</Select.Option>
              </Select>{' '}
              <Button
                type="primary"
                style={{
                  paddingLeft: 30,
                  paddingRight: 30,
                }}
                // eslint-disable-next-line react/jsx-no-bind
                onClick={() => this.props.onUploadAndAnnounce(date, time, announcement)}
                disabled={!isUploadingEnable || !isPostingEnabled}
                loading={pending}>
                {pending ? 'Завантажуємо' : 'Завантажити'}
              </Button>
              {/* <Button
                type="primary"
                onClick={() =>
                  this.props.onUploadAndAnnounce(date, time, announcement)
                }>
                Post Announcement (test)
              </Button> */}
            </Col>
          </Row>
        </Container>
      </div>
    );
  }
}

export default Header;
