import React, { Component } from 'react';
import { Payment as PaymentType } from '../types';

type Props = {
  orderId: string;
  token: string;
  payment: PaymentType;
};

export default class Payment extends Component<Props> {
  render() {
    const { payment } = this.props;

    return (
      <iframe
        title="Privat Bank"
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
