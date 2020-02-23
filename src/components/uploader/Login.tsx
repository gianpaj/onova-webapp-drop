import React from 'react';
import { Button, Form, Input } from 'antd';
import { FormComponentProps } from 'antd/lib/form';

import './Login.scss';
import StoreButtons from '../StoreButtons';

export interface IProps extends FormComponentProps {
  onLogin: (emailAddress: string, password: string) => Promise<any>;
}

type State = {
  loading: boolean;
  emailAddress: string;
  password: string;
};

function hasErrors(fieldsError: any) {
  return Object.keys(fieldsError).some(field => fieldsError[field]);
}

class Login extends React.Component<IProps, State> {
  state = {
    loading: false,
    emailAddress: '',
    password: '',
  };

  componentDidMount() {
    this.props.form.validateFields();
  }

  handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    this.setState({ loading: true });
    this.props.form.validateFields(async (err: any, values: any) => {
      if (!err) {
        await this.props.onLogin(values.email, values.password);
        this.setState({ loading: false });
      }
    });
  };

  render() {
    const { loading } = this.state;
    const { getFieldDecorator, getFieldsError, getFieldError, setFieldsValue, isFieldTouched } = this.props.form;

    // Only show error after a field is touched.
    const emailError = isFieldTouched('email') && getFieldError('email');
    const passwordError = isFieldTouched('password') && getFieldError('password');

    return (
      <div style={{ flex: 1 }}>
        <div
          style={{
            backgroundColor: '#000',
            padding: 20,
            justifyContent: 'center',
            alignItems: 'center',
            display: 'flex',
            flexDirection: 'column',
          }}>
          <img
            alt="Drop logo"
            className="logo"
            src={require('../../images/logo-vector.svg')}
            style={{ width: 100, height: 100 }}
          />
          <span
            style={{
              fontSize: 16,
              color: 'white',
              marginTop: 30,
            }}>
            Завантажувач Дропів
          </span>
        </div>
        <div
          style={{
            alignItems: 'center',
            display: 'flex',
            width: '300px',
            margin: '30px auto',
          }}>
          <span style={{ color: 'white' }}>Login</span>
          <Form onSubmit={this.handleSubmit}>
            <Form.Item validateStatus={emailError ? 'error' : 'success'} help={emailError || ''}>
              {getFieldDecorator('email', {
                rules: [{ required: true, message: 'Вкажіть ваш email' }],
              })(
                <Input
                  autoComplete="email"
                  autoFocus
                  disabled={loading}
                  placeholder="email address"
                  type="email"
                  // eslint-disable-next-line react/jsx-no-bind
                  onChange={e => setFieldsValue({ email: e.target.value })}
                />
              )}
            </Form.Item>
            <Form.Item validateStatus={passwordError ? 'error' : 'success'} help={passwordError || ''}>
              {getFieldDecorator('password', {
                rules: [{ required: true, message: 'Вкажіть ваш пароль' }],
              })(
                <Input
                  autoComplete="current-password"
                  disabled={loading}
                  placeholder="password"
                  type="password"
                  // eslint-disable-next-line react/jsx-no-bind
                  onChange={e => setFieldsValue({ password: e.target.value })}
                />
              )}
            </Form.Item>
            <Form.Item>
              <Button
                style={{ marginTop: 10 }}
                htmlType="submit"
                loading={loading}
                disabled={hasErrors(getFieldsError())}
                type="primary">
                Увійти
              </Button>
            </Form.Item>
          </Form>
        </div>
        <div className="text-center mx-auto" style={{ maxWidth: 320 }}>
          <p>Створити профіль з мобільного додатку</p>
          <StoreButtons classNames="mx-auto no-gutters" />
        </div>
      </div>
    );
  }
}

// https://github.com/ant-design/ant-design/pull/16242
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default Form.create()(Login) as any;
