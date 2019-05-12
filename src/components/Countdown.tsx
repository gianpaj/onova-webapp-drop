// inspired from https://github.com/sungwoncho/react-cntdwn/blob/c4f7a88808f5d4428448faf54760a58fc0475cf0/src/cntdwn.jsx

import moment from 'moment';
import React, { Component } from 'react';

const COUNTDOWN_NOT_STARTED = 1;
const COUNTDOWN_STARTED = 2;
const COUNTDOWN_FINISHED = 3;

type Props = {
  interval: number;
  startDelay: number;
  onFinished?: () => {};
  targetDate: Date;
  className: string;
  format: {
    day: string;
    hour: string;
    minute: string;
    second: string;
  };
  leadingZero: boolean;
  timeSeparator: string;
};

type State = {
  remainingTime: number;
  status: number;
  intervalId?: number;
};
export default class Countdown extends Component<Props, State> {
  static defaultProps = {
    className: '',
    format: {
      hour: 'HH',
      minute: 'MM',
      second: 'SS',
    },
    interval: 1000,
    leadingZero: false,
    startDelay: 0,
    timeSeparator: ' ',
  };

  state = {
    intervalId: undefined,
    remainingTime: 0,
    status: COUNTDOWN_NOT_STARTED,
  };

  componentDidMount = () => {
    setTimeout(() => {
      const timer = window.setInterval(() => {
        this.tick();
      }, this.props.interval);

      this.setState({
        intervalId: timer,
        status: COUNTDOWN_STARTED,
      });

      this.tick();
    }, this.props.startDelay);
  };

  componentWillUnmount = () => {
    if (this.state.intervalId) clearInterval(this.state.intervalId);
  };

  calculateRemainingTime = () => {
    return -1 * moment().diff(this.props.targetDate);
  };

  addLeadingZero = (value: number) => {
    if (value < 10) {
      return parseInt(`0${value.toString()}`);
    }
    return value;
  };

  tick = () => {
    this.setState({
      remainingTime: this.calculateRemainingTime(),
    });

    if (this.state.remainingTime <= 0) {
      this.setState({
        status: COUNTDOWN_FINISHED,
      });

      if (this.props.onFinished) {
        this.props.onFinished();
      }
      clearInterval(this.state.intervalId);
    }
  };

  renderRemainingTime = () => {
    const html = [];
    const { format, leadingZero, timeSeparator } = this.props;
    const { remainingTime } = this.state;

    if (format.day) {
      let days = moment.duration(remainingTime).get('days');

      if (leadingZero) {
        days = this.addLeadingZero(days);
      }

      html.push(
        <span className="react-cntdwn-day" key="day">
          {days}
          &nbsp;
        </span>
      );
    }

    if (format.hour) {
      let hours = moment.duration(remainingTime).get('hours');

      if (leadingZero) {
        hours = this.addLeadingZero(hours);
      }

      html.push(
        <span className="react-cntdwn-hour" key="hour">
          {hours}
          {timeSeparator}
        </span>
      );
    }

    if (format.minute) {
      let minutes = moment.duration(remainingTime).get('minutes');

      if (leadingZero) {
        minutes = this.addLeadingZero(minutes);
      }

      html.push(
        <span className="react-cntdwn-minute" key="minute">
          {minutes}
          {timeSeparator}
        </span>
      );
    }

    if (format.second) {
      let seconds = moment.duration(remainingTime).get('seconds');

      if (leadingZero) {
        seconds = this.addLeadingZero(seconds);
      }

      html.push(
        <span className="react-cntdwn-second" key="second">
          {seconds}
        </span>
      );
    }

    return html;
  };

  render = () => {
    const { className, targetDate } = this.props;

    if (this.state.status === COUNTDOWN_NOT_STARTED) {
      return <span />;
    }

    return (
      <h5 className={`react-cntdwn-timer ${className}`} title={`the Drop will be listen ${targetDate}`}>
        {this.renderRemainingTime()}
      </h5>
    );
  };
}
