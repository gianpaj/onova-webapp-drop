import React, { Component } from 'react';

import * as api from '../utility/api';
import { Payment as PaymentType } from '../types';
import { Spinner } from '../components';
import '../index.scss';

interface Props {
  cvc: string;
  order: any;
  token: string;
}

type State = {
  payment: PaymentType;
};

class Payment extends Component<Props, State> {
  state = {
    payment: (null as unknown) as PaymentType,
  };

  componentDidMount() {
    this.initiate();
  }

  async initiate() {
    const payment = await this.createPayment();
    this.setState({ payment });
  }

  async createPayment(): Promise<any> {
    const { token, cvc, order } = this.props;
    const body = await api.post(`/api/orders/${order.id}/pay`, { cvc }, { token });
    return body.data.payment;
  }

  render() {
    const { payment } = this.state;
    if (!payment) return <Spinner height={202} />;

    return (
      <iframe
        title="payment.uapay"
        style={{ border: 0, width: '100%', height: '100%' }}
        srcDoc={`
        <form action="${payment.url}" method="POST">
          <input name="TermUrl" value="${payment.redirectUrl}" type="hidden" />
          <input name="PaReq" value="${payment.PaReq}" type="hidden" />
        </form>
        <script>document.getElementsByTagName('form')[0].submit();</script>
      `}
      />
    );
  }
}

export default Payment;
