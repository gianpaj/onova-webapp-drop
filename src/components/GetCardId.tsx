import React, { Component } from 'react';
import { Button } from 'reactstrap';
import { toaster } from 'evergreen-ui';

import * as api from '../utility/api';
import Spinner from './Spinner';

let URL_BASE = 'https://api.demo.uapay.ua';

if (api.isProd) {
  URL_BASE = 'https://api.uapay.ua';
}

let iframe: Window;

type Props = {
  onCancel: (event: React.FormEvent<HTMLButtonElement>) => void;
  onCardTokenRetrieved: (payload: any) => void;
};

export default class GetCardId extends Component<Props> {
  state = {
    loading: true,
    tokenForCardIFrame: '',
  };

  componentDidMount() {
    this.generateTokenForIFrame()
      .then(tokenForCardIFrame => {
        this.setState({ tokenForCardIFrame, loading: false });
        this.JStoInject();
      })
      .catch(e => {
        console.error(e);
        this.setState({ loading: false });
        // console.log(tokenForCardIFrame);
      });
  }

  componentWillUnmount() {
    // window.removeEventListener('message', this.listener);
  }

  onFinished = async (data: string | any) => {
    try {
      // TODO: if TIMELIMIT_ERROR reload
      if (data.name === 'Error' && data.code === 'TIMELIMIT_ERROR') {
        this.setState({ loading: true });
        const tokenForCardIFrame = await this.generateTokenForIFrame();
        this.setState({ tokenForCardIFrame, loading: false });
        return;
      }
      if (data.name !== 'Success') throw Error(data.code);

      this.props.onCardTokenRetrieved(data.payload);
      // return to previous screen (Settings or Checkout)
    } catch (error) {
      toaster.danger(error.message, { duration: 30 });
      console.error(JSON.stringify(error));
    }
  };

  onSaveCard() {
    if (iframe) {
      // iframe.postMessage('Submit', 'onova.co');
      iframe.postMessage('Submit', '*');
      return;
    }
    console.error('no iframe');
  }

  async generateTokenForIFrame() {
    const { data } = await api.get('/api/auth/get-token');
    return data;
  }

  JStoInject() {
    // @ts-ignore:disable-line
    iframe = document.getElementById('uapayFrame').contentWindow;

    if (!iframe) return;

    const self = this;

    function listener(event: any) {
      if (event.data && event.data.name && event.data.name !== 'Validation') {
        self.onFinished(event.data);
      }
    }

    window.addEventListener('message', listener, false);
  }

  render() {
    const { loading, tokenForCardIFrame } = this.state;

    if (loading) return <Spinner height={202} />;

    return (
      <div>
        <div className="mx-auto" style={{ width: 300 }}>
          <iframe
            id="uapayFrame"
            src={`${URL_BASE}/api/iframe/${tokenForCardIFrame}`}
            style={{ height: 202 }}
            className="my-2 border-0"
            title="UAPAY"
          />
        </div>
        <Button block color="primary" onClick={this.onSaveCard}>
          Далі
        </Button>
        <Button block outline onClick={this.props.onCancel}>
          Скасувати
        </Button>
      </div>
    );
  }
}
