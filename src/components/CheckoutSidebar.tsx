import React, { ChangeEvent, Component } from 'react';

import { Button as ButtonBP, Classes, Icon, Menu, MenuItem } from '@blueprintjs/core';
import { Select } from '@blueprintjs/select';
import { configureScope } from '@sentry/browser';
import { Card, IconButton, Pane, SideSheet, toaster } from 'evergreen-ui';
import { Formik } from 'formik';
import ReactDOM from 'react-dom';
import { Button, Col, FormGroup, Input, Modal, ModalFooter, ModalHeader, Row } from 'reactstrap';
import store from 'store';
import isEmail from 'validator/lib/isEmail';
import isMobilePhone from 'validator/lib/isMobilePhone';

import * as api from '../utility/api';
import * as util from '../utility/Utility';

import { EnterCardInfo, Spinner } from '.';
import { Payment } from '../pages';
import { City, Department, Order, Payment as PaymentType, User } from '../types';
import './CheckoutSidebar.scss';

const cyrillicRegex = /^$|^[\u0400-\u04FF\s]+$/;

const LIMIT_BY = 20;

type FormFields = {
  firstName?: string;
  lastName?: string;
  email?: string;
  mobileNumber?: string;
};

type Props = {
  itemUuid: string;
  onToggleSidebar: () => void;
};

type State = {
  areFeesLoading: boolean;
  buyer: User;
  cardToken: string;
  cities: City[];
  city?: City;
  cvc: string;
  department?: Department;
  departments: Department[];
  gettingCardToken: boolean;
  isInitiating: boolean;
  isLoading: boolean;
  isLoadingPayment: boolean;
  isMobile: boolean;
  promptIsShown: boolean;
  order: Order;
  payment: PaymentType;
  shippingFee: string;
  step: number;
  token: string;
};

export default class CheckoutSidebar extends Component<Props, State> {
  containerEl = document.createElement('div');
  externalWindow = null;
  thisFormik: any;

  readonly state = {
    areFeesLoading: false,
    buyer: {} as User,
    cardToken: '',
    cities: [],
    city: {} as City,
    cvc: '',
    department: {} as Department,
    departments: [],
    gettingCardToken: true,
    isInitiating: true,
    isLoading: false,
    isLoadingPayment: false,
    isMobile: window.innerWidth <= 500,
    promptIsShown: false,
    order: {} as Order,
    payment: {} as PaymentType,
    // isPending: false, // TODO:
    // seller: null,
    shippingFee: '',
    step: 1, // starts from 1
    token: '',
  };

  componentWillMount() {
    window.addEventListener('resize', this.handleWindowSizeChange);
  }

  async componentDidMount() {
    await this.initialize();
    window.addEventListener('beforeunload', this.onUnload);
    configureScope(scope => {
      scope.setUser({ ...this.state.buyer });
      // scope.clear();
    });
    // this.setState({ isLoading: true });
    // check if we have JWT token stored and valid
    // otherwise request a new one (create an anonymous user on the backend)
    //
  }

  componentWillUnmount() {
    this.onUnload();
    window.removeEventListener('beforeunload', this.onUnload);
    window.removeEventListener('resize', this.handleWindowSizeChange);
  }

  onUnload = () => this.state.step !== 4 && this.cancelOrder();

  handleWindowSizeChange = () => this.setState({ isMobile: window.innerWidth <= 500 });

  async initialize() {
    try {
      const token = await this.createOrGetToken();

      const [order, cities, buyer] = await Promise.all([
        this.getOrder(this.props.itemUuid, token),
        api.getCities(token),
        api.getWebUser(token),
      ]);
      // const seller = await api.getUser(order.seller);
      if (buyer.shippingAddress) {
        const city = cities.find(c => c.id === buyer.shippingAddress.city);
        if (city) {
          const departments = await api.getDepartments(city.id);
          const department = departments.find(d => d.id === buyer.shippingAddress.departmentNovaposhta);
          this.setState({ city, department, departments });
        }
      }
      this.setState({
        buyer,
        cities,
        isInitiating: false,
        order,
        token,
      });
    } catch (error) {
      const { message } = error;
      if (message) {
        if (message === 'jwt expired' || message === 'Unauthorized web user') {
          console.debug('jwt expired');
          store.remove('token-web');
          this.initialize();
          return;
        } else if (message.includes('Seller is missing payment or shipping')) {
          toaster.danger('У продавця відсутня інформація оплати чи адреси');
        } else {
          toaster.danger(message);
        }
      }
      console.error(error);
      this.onToggleSidebar();
    }
  }

  async cancelOrder() {
    const { order, token } = this.state;
    if (!order.id) return;
    try {
      await api.put(`/api/orders/${order.id}`, { status: 'cancelled' }, { token });
    } catch (error) {
      console.error(error);
    }
  }

  async getOrder(itemUuid: string, token: string) {
    try {
      const order = await api.createOrder(itemUuid, token);
      return order;
    } catch (error) {
      if (error.data && error.data.data) {
        const { data } = error.data;
        if (error.message === 'Duplicate order' && data.status === 'confirmed') {
          console.log(error);
        }
        if (data.status === 'pending' || data.status === 'cancelled') {
          return data;
        }
      }
      throw error;
    }
  }

  async createOrGetToken() {
    const localToken = store.get('token-web');
    if (localToken) return localToken;
    const { token } = await api.createUserWeb();
    store.set('token-web', token);
    return token;
  }

  onCloseSidebar = () => {
    if (this.state.step < 4) {
      this.setState({ promptIsShown: true });
    } else {
      this.props.onToggleSidebar();
    }
    return false;
  };

  onToggleSidebar = () => {
    this.setState({ promptIsShown: false });
    this.props.onToggleSidebar();
  };

  renderModal() {
    return (
      <Pane>
        <Modal isOpen={this.state.promptIsShown}>
          <ModalHeader className="pt-4">Ви впевнені що хочете скасувати замовлення?</ModalHeader>
          <ModalFooter className="mx-auto pb-4">
            {/* eslint-disable-next-line react/jsx-no-bind */}
            <Button outline color="primary" onClick={() => this.setState({ promptIsShown: false })}>
              Продовжити замовлення
            </Button>
            <Button color="danger" onClick={this.onToggleSidebar}>
              Скасувати замовлення
            </Button>
          </ModalFooter>
        </Modal>
      </Pane>
    );
  }

  renderPricingContainer() {
    const {
      areFeesLoading,
      order,
      shippingFee, // seller,
    } = this.state;

    if (areFeesLoading) {
      return <Spinner height={98} />;
    }

    const currency = 'грн';
    const total = parseFloat(order.priceOfItem) + parseFloat(shippingFee);
    return (
      <div className="container">
        <div className="row">
          <div className="col">
            <h4 className="label total-label">Загалом:</h4>
          </div>
          <div className="col">
            <h4 className="total text-right">
              {util.formatCurrency(total)} {currency}
            </h4>
          </div>
        </div>
        <div className="row">
          <div className="col">
            <p className="label">Річ:</p>
          </div>
          <div className="col">
            <p className="text-right">
              {util.formatCurrency(parseInt(order.priceOfItem))} {currency}
            </p>
          </div>
        </div>
        <div className="row">
          <div className="col">
            <p className="label">Вартість доставки:</p>
          </div>
          <div className="col">
            <p className="text-right">
              {util.formatCurrency(parseInt(shippingFee))} {currency}
            </p>
          </div>
        </div>
        {/* <div className="row">
          <div className="col-9">
            <p>
              @
              <span
                dangerouslySetInnerHTML={{
                  __html: util.truncate(seller.username, 12),
                }}
              />
              {' '}
              місцезнаходження:
            </p>
          </div>
          <div className="col-3 text-right">
            <p>Україна</p>
          </div>
        </div> */}
      </div>
    );
  }

  payButtonIsEnabled = () => {
    // pending,
    const { cvc, cardToken } = this.state;
    return cardToken.length > 0 && cvc.length === 3;
  };

  handleCityChange = async (city: City) => {
    if (!city) this.setState({ departments: [] });
    else {
      let departments = await api.getDepartments(city.id);
      departments = departments.map(d => ({ ...d, uk: d.uk.replace('Відділення ', '') }));
      this.setState({ departments });
      // TODO: Automatically focus on Department InputItem

      // reset depart
      if (this.state.city && city.id !== this.state.city.id) {
        this.setState({ department: undefined });
      }
    }
    this.setState({ city });
  };

  handleDepartmentChange = async (department: Department) => {
    const { order, token } = this.state;
    if (department) {
      this.setState({ areFeesLoading: true });
      try {
        const shippingFee = await api.getShippingCosts(order.priceOfItem, order.id, department.id, token);
        this.setState({ shippingFee });
      } catch (error) {
        console.error(error);
        toaster.danger(error.message, { duration: 30 });
      }
      this.setState({ areFeesLoading: false });
    }
    this.setState({ department });
  };

  renderItemSelect = (
    item: { id: string | number | undefined; uk: string },
    { handleClick, modifiers, query }: any
  ) => {
    if (!modifiers.matchesPredicate) {
      return null;
    }

    return (
      <MenuItem
        active={modifiers.active}
        disabled={modifiers.disabled}
        key={item.id}
        onClick={handleClick}
        text={highlightText(item.uk, query)}
      />
    );
  };

  filterSelectCity = (query: string, city: City) => {
    const cleanText = query.trim().replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(cleanText, 'i');
    return regex.test(city.uk);
    // return city.uk.indexOf(query.toLowerCase()) >= 0;
  };

  filterSelectDepartment = (query: string, item: Department) => {
    const cleanText = query.trim().replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(cleanText, 'i');

    // if typing a string
    if (Number.isNaN(Number(cleanText))) return regex.test(item.uk);

    // if typing a number
    const matches = item.uk.match(/№(\w+)/);
    if (matches) return regex.test(matches[1]);
    return false;
  };

  renderSelectList = ({
    items,
    itemsParentRef,
    renderItem,
  }: {
    items: City[];
    itemsParentRef: (ref: HTMLElement | null) => void;
    renderItem: (item: any, index: number) => JSX.Element | null;
  }) => {
    const renderedItems = items
      .map(renderItem)
      .filter(item => item != null)
      .slice(0, LIMIT_BY);

    return <Menu ulRef={itemsParentRef}>{renderedItems}</Menu>;
  };

  renderCityAutocomplete() {
    const { cities, city, isInitiating } = this.state;

    return (
      <FormGroup>
        <Select
          inputProps={{ placeholder: 'Місто' }}
          itemListRenderer={this.renderSelectList}
          itemPredicate={this.filterSelectCity}
          itemRenderer={this.renderItemSelect}
          items={cities}
          initialContent={<MenuItem disabled text="Місто" />}
          noResults={<MenuItem disabled text="Error finding cities." />}
          onItemSelect={this.handleCityChange}
          popoverProps={{ minimal: true, autoFocus: false, position: 'bottom' }}>
          <ButtonBP
            className={isInitiating ? Classes.SKELETON : ''}
            text={city && city.uk ? city.uk : '(Місто)'}
            rightIcon="caret-down"
          />
        </Select>
      </FormGroup>
    );
  }

  renderDepartmentAutocomplete() {
    const { departments, department, isInitiating } = this.state;

    return (
      <FormGroup>
        <Select
          disabled={departments.length === 0}
          itemListRenderer={this.renderSelectList}
          itemPredicate={this.filterSelectDepartment}
          itemRenderer={this.renderItemSelect}
          items={departments}
          noResults={<MenuItem disabled text="Обери місто." />}
          onItemSelect={this.handleDepartmentChange}
          popoverProps={{ minimal: true, autoFocus: false, position: 'bottom' }}
          inputProps={{ placeholder: 'Filter (translate)' }}>
          <ButtonBP
            className={isInitiating ? Classes.SKELETON : ''}
            disabled={departments.length === 0}
            text={department && department.uk ? department.uk : '(Відділення Нової Пошти)'}
            rightIcon="caret-down"
          />
        </Select>
      </FormGroup>
    );
  }

  onSubmit = async (
    values: { mobileNumber: any; firstName: any; lastName: any; email: any },
    { setSubmitting }: any
  ) => {
    try {
      await this.updateUserInfo(values);
    } catch (error) {
      console.error(error);
      toaster.danger(error.message);
      setSubmitting(false);
    }
  };

  updateUserInfo({ mobileNumber, firstName, lastName, email }: FormFields): Promise<any> {
    const { city, department, token, cardToken } = this.state;

    // FIXME: state should be the mobileNumber unformatted. useful also to compare if number has been changed

    return api.put(
      '/api/users-web/me',
      {
        emailAddress: email,
        mobileNumber: mobileNumber ? mobileNumber.replace(/\D\+/g, '') : null,
        paymentInfoPayload: cardToken,
        shippingAddress: {
          city: city.id,
          departmentNovaposhta: department.id,
          firstName,
          lastName,
        },
        short: false,
      },
      { token }
    );
  }

  onNextStep = () => this.setState(prevState => ({ step: prevState.step + 1 }));

  onPrevStep = () => this.setState(prevState => ({ step: prevState.step - 1 }));

  renderInfoForm() {
    const {
      values,
      errors,
      touched,
      handleChange,
      handleBlur,
    }: {
      values: FormFields;
      errors: FormFields;
      touched: FormFields;
      handleChange: (event: ChangeEvent<HTMLInputElement>) => void;
      handleBlur: (event: ChangeEvent<HTMLInputElement>) => void;
    } = this.thisFormik;
    const className = this.state.isInitiating ? Classes.SKELETON : '';
    return (
      <>
        <h4 className="text-center mb-3">Адреса доставки:</h4>
        <FormGroup className={className}>
          <Input
            type="text"
            name="firstName"
            autoComplete={values.firstName == null ? 'given-name' : values.firstName}
            onChange={handleChange}
            onBlur={handleBlur}
            value={values.firstName}
            // @ts-ignore:disable-line
            invalid={errors.firstName && touched.firstName}
            placeholder="Ім'я"
          />
        </FormGroup>
        <FormGroup className={className}>
          <Input
            type="text"
            name="lastName"
            autoComplete={values.lastName == null ? 'family-name' : values.lastName}
            onChange={handleChange}
            onBlur={handleBlur}
            value={values.lastName}
            // @ts-ignore:disable-line
            invalid={errors.lastName && touched.lastName}
            placeholder="Прізвище"
          />
        </FormGroup>
        <FormGroup className={className}>
          <Input
            type="text"
            name="email"
            autoComplete="email"
            onChange={handleChange}
            onBlur={handleBlur}
            value={values.email}
            // @ts-ignore:disable-line
            invalid={errors.email && touched.email}
            placeholder="Email"
          />
        </FormGroup>
        <FormGroup className={className}>
          <Input
            type="text"
            autoComplete="tel"
            name="mobileNumber"
            onChange={handleChange}
            onBlur={handleBlur}
            value={values.mobileNumber}
            // @ts-ignore:disable-line
            invalid={errors.mobileNumber && touched.mobileNumber}
            placeholder="09712345678 Мобільний телефон"
          />
        </FormGroup>
        {this.renderCityAutocomplete()}
        {this.renderDepartmentAutocomplete()}
      </>
    );
  }

  firstStepButtonIsEnabled() {
    const { errors }: { errors: FormFields } = this.thisFormik,
      { department, city } = this.state,
      { lastName, firstName, email, mobileNumber } = this.thisFormik.values;

    return (
      !Object.keys(errors).length &&
      department &&
      department.id &&
      city &&
      city.id &&
      email &&
      mobileNumber &&
      firstName &&
      lastName
    );
  }

  onCardTokenRetrieved = (cardToken: any) => this.setState({ cardToken, gettingCardToken: false });

  changeCVC = (e: React.FormEvent<HTMLInputElement>) => this.setState({ cvc: e.currentTarget.value });

  onEnterFromCVC = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') this.onFinalStep();
  };

  cancelGettingCardToken = () => {
    this.onPrevStep();
    this.setState({ gettingCardToken: false });
  };

  onFinalStep = async () => {
    const { values }: { values: FormFields } = this.thisFormik;
    try {
      await this.updateUserInfo(values);
      this.setState({ isLoadingPayment: true });
      const payment = await this.createPayment();
      // TODO: if payment is LOOKUP show Confirmation input field
      // else render Payment iframe
      this.setState({ payment });
      this.onNextStep();
      // after 1 second start the process of waiting until the user has confirmed the payment in the new window
      setTimeout(() => {
        this.onPaymentClose();
      }, 1000);
    } catch (error) {
      console.error(error);
      toaster.danger(error.message);
      this.setState({ isLoadingPayment: false });
    }
  };

  async createPayment(): Promise<any> {
    const { token, cvc, order } = this.state;
    const body: any = await api.post(`/api/orders/${order.id}/pay`, { cvc }, { token });
    // console.debug(body.data);
    return body.data.payment;
  }

  renderPaymentIframe = () => (
    <PaymentPortal>
      <Payment payment={this.state.payment} />
    </PaymentPortal>
  );

  onPaymentClose = async () => {
    try {
      // retry for x amount of times with 1 sec in between until payment status is finished
      let retryNum = 0;
      let transactionStatus;
      do {
        retryNum++;
        const { status } = await this.getPaymentStatus();
        transactionStatus = status;
        console.debug(status);
        await util.sleep(1000);
      } while (transactionStatus !== 'ua-finished' && retryNum < 240); // 4 mins

      // TODO: handle transaction has been already 'paid'
      // if error.code == 'NOT_ALLOWED'
      // return to previous screen (Checkout)

      if (transactionStatus !== 'ua-finished') {
        throw new Error('Timeout issue confirming payment finished');
      }
      this.onNextStep();
    } catch (error) {
      toaster.danger(error.message);
      console.error(error);
    }
    this.setState({ isLoadingPayment: false });
  };

  renderSuccess() {
    // TODO: translate
    return (
      <div className="text-center my-5">
        <Icon icon="tick-circle" intent="success" iconSize={60} />
        <h3 className="mt-3">Оплату здійснено!</h3>
        <p>Після підтвердження покупки продавцем ви отримаєте електронний лист на вказану пошту</p>
      </div>
    );
  }

  async getPaymentStatus() {
    const { token, order } = this.state;
    const { data } = await api.get(`/api/orders/${order.id}/paymentStatus`, { token });
    return data;
  }

  renderPaymentForm() {
    const { isSubmitting }: { isSubmitting: boolean } = this.thisFormik;
    const { cardToken, gettingCardToken } = this.state;

    return (
      <div className="payment-info">
        {gettingCardToken && (
          <EnterCardInfo onCardTokenRetrieved={this.onCardTokenRetrieved} onCancel={this.cancelGettingCardToken} />
        )}
        {cardToken.length > 0 && (
          // @ts-ignore:disable-line
          <Row form>
            <Col>
              <FormGroup className="mt-3 mx-auto w-25">
                <Input
                  aria-label="Credit or debit card CVC/CVV"
                  aria-placeholder="CVC"
                  autoComplete="cc-csc"
                  autoFocus
                  type="text"
                  pattern="\d*"
                  onChange={this.changeCVC}
                  value={this.state.cvc}
                  placeholder="CVC"
                  maxLength={3}
                  minLength={3}
                  required
                  spellCheck={false}
                  disabled={isSubmitting}
                  onKeyPress={this.onEnterFromCVC}
                />
              </FormGroup>
            </Col>
          </Row>
        )}
      </div>
    );
  }

  renderMandatoryLogos() {
    return (
      <div className="px-3 mt-3">
        <div className="py-3 text-center">
          <img style={{ width: '65px' }} className="px-2" alt="visa-logo" src={require('../images/visa.svg')} />
          <img
            style={{ width: '47px' }}
            alt="mastercard-logo"
            className="px-2"
            src={require('../images/mastercard.svg')}
          />
          <img style={{ width: '100px' }} alt="pci-logo" className="px-2" src={require('../images/pci.svg')} />
          <img style={{ width: '55px' }} alt="uapay-logo" className="px-2" src={require('../images/uapay.png')} />
        </div>
      </div>
    );
  }

  renderMandatoryText() {
    return (
      <div className="mandatory-text px-3 mt-3">
        <img src={require('../images/ios-checkmark.svg')} alt="checkmark" width="20" height="20" />{' '}
        <span>Натискаючи на кнопку «Придбати», ви погоджуєтесь з </span>
        <a target="_blank" rel="noopener noreferrer" href="https://uapay.ua/ru/rules">
          умовами публічних договорів,
        </a>{' '}
        <a target="_blank" rel="noopener noreferrer" href="https://uapay.ua/ru/rules?anchor=userAgreement">
          умовами погодження на обробку персональних даних,
        </a>{' '}
        <a target="_blank" rel="noopener noreferrer" href="https://novaposhta.ua/uploads/misc/doc/Terms_of_Service.pdf">
          умовами надання послуг логістичним партнером,
        </a>{' '}
        <a target="_blank" rel="noopener noreferrer" href="https://novaposhta.ua/uploads/misc/doc/public_offer.pdf">
          публічним договором про надання послуг по організації перевезення відправлень,
        </a>{' '}
        <span>а також приймаєте </span>
        <a target="_blank" rel="noopener noreferrer" href="https://drop.uno/safe-purchase-rules.html">
          Правила надання сервісу Безпечна покупка.
        </a>
      </div>
    );
  }

  validateForm(values: any) {
    const errors: FormFields = {};
    if (!values.firstName) {
      errors.firstName = "Обов'язково"; // required
    } else if (!cyrillicRegex.test(values.firstName)) {
      errors.firstName = "Обов'язково"; // required
    }
    if (!values.lastName) {
      errors.lastName = "Обов'язково"; // required
    } else if (!cyrillicRegex.test(values.lastName)) {
      errors.lastName = "Обов'язково"; // required
    }
    if (!values.mobileNumber) {
      errors.mobileNumber = "Обов'язково"; // required
    } else if (!isMobilePhone(values.mobileNumber, 'uk-UA')) {
      errors.mobileNumber = 'відсутній Мобільний телефон';
    }
    if (!values.email) {
      errors.email = "Обов'язково"; // required
    } else if (!isEmail(values.email)) {
      errors.email = 'Електронна адреса не дійсна'; // invalid email
    }
    return errors;
  }

  renderButtons(formik: any) {
    const { isInitiating, isLoadingPayment, step, gettingCardToken } = this.state;

    return (
      <>
        {step === 1 && (
          <Button
            block
            className={isInitiating ? Classes.SKELETON : ''}
            color="primary"
            disabled={!this.firstStepButtonIsEnabled()}
            onClick={this.onNextStep}>
            {/* onClick={() => this.setState({ step: 3 })}> */}
            Далі
          </Button>
        )}

        {step === 2 && !gettingCardToken && (
          <Button
            block
            color="danger"
            className={`${isInitiating ? Classes.SKELETON : ''} float-right mb-5 mt-2`}
            disabled={formik.isSubmitting || isLoadingPayment || !this.payButtonIsEnabled()}
            onClick={this.onFinalStep}>
            Придбати
          </Button>
        )}

        {step === 3 && (
          <div className="d-flex justify-content-between">
            <Button
              className={isInitiating ? Classes.SKELETON : ''}
              onClick={this.onPrevStep}
              disabled={formik.isSubmitting || !this.payButtonIsEnabled() || gettingCardToken || isLoadingPayment}>
              Назад
            </Button>
            <Button
              color="primary"
              className={`${isInitiating ? Classes.SKELETON : ''} float-right`}
              disabled={formik.isSubmitting || !this.payButtonIsEnabled() || gettingCardToken || isLoadingPayment}
              type="submit"
              // @ts-ignore:disable-line
              onClick={formik.handleSubmit}>
              Придбати
            </Button>
          </div>
        )}
      </>
    );
  }

  render() {
    const { isLoading, isLoadingPayment, isMobile, step, gettingCardToken, buyer } = this.state;

    let firstName = '';
    let lastName = '';

    if (buyer.displayName) [firstName, lastName] = buyer.displayName.split(' ');

    return (
      <>
        <SideSheet
          isShown
          onCloseComplete={this.props.onToggleSidebar}
          preventBodyScrolling
          shouldCloseOnEscapePress={false}
          onBeforeClose={this.onCloseSidebar}
          containerProps={{
            display: 'flex',
            flex: '1',
            flexDirection: 'column',
            textAlign: 'left',
          }}
          width={isMobile ? '100%' : '500px'}>
          <Pane zIndex={1} flexShrink={0} elevation={0} backgroundColor="white">
            <Pane padding={16} borderBottom="muted">
              <div>
                {isMobile && (
                  <IconButton onClick={this.onCloseSidebar} style={{ position: 'absolute' }} icon="cross" height={40} />
                )}
                <h4 style={isMobile ? { height: 32, paddingTop: 8 } : {}} className="text-center">
                  Checkout
                </h4>
              </div>
            </Pane>
            <Pane flex="1" overflowY="scroll" background="tint1" padding={16}>
              {isLoading ? (
                <Spinner />
              ) : (
                <div className="checkout-sidebar">
                  <Card
                    alignItems="center"
                    backgroundColor="white"
                    className="py-3"
                    display="flex"
                    elevation={0}
                    flexDirection="column"
                    justifyContent="center"
                    marginBottom={10.66}>
                    {this.renderPricingContainer()}
                  </Card>
                  <Card
                    alignItems="center"
                    backgroundColor="white"
                    className="py-3"
                    display="flex"
                    elevation={0}
                    flexDirection="column"
                    justifyContent="start">
                    <Formik
                      initialValues={{
                        email: buyer.emailAddress || '',
                        firstName,
                        lastName,
                        mobileNumber: buyer.mobileNumber || '',
                      }}
                      enableReinitialize
                      validate={this.validateForm}
                      onSubmit={this.onSubmit}>
                      {formik => {
                        this.thisFormik = formik;
                        return (
                          <form onSubmit={formik.handleSubmit}>
                            {step === 1 && this.renderInfoForm()}
                            {step === 2 && !isLoadingPayment && this.renderPaymentForm()}
                            {step === 3 && this.renderPaymentIframe()}
                            {step === 4 && this.renderSuccess()}

                            {isLoadingPayment && <Spinner height={202} />}

                            {this.renderButtons(formik)}
                          </form>
                        );
                      }}
                    </Formik>
                    {step === 2 && !gettingCardToken && this.renderMandatoryText()}
                    {this.renderMandatoryLogos()}
                  </Card>
                </div>
              )}
            </Pane>
          </Pane>
        </SideSheet>
        {this.renderModal()}
      </>
    );
  }
}

function escapeRegExpChars(text: string) {
  return text.replace(/([.*+?^=!:${}()|[\]/\\])/g, '\\$1');
}

function highlightText(text: string, query: string) {
  let lastIndex = 0;
  const words = query
    .split(/\s+/)
    .filter(word => word.length > 0)
    .map(escapeRegExpChars);
  if (words.length === 0) {
    return [text];
  }
  const regexp = new RegExp(words.join('|'), 'gi');
  const tokens: React.ReactNode[] = [];
  while (true) {
    const match = regexp.exec(text);
    if (!match) {
      break;
    }
    const { length } = match[0];
    const before = text.slice(lastIndex, regexp.lastIndex - length);
    if (before.length > 0) {
      tokens.push(before);
    }

    lastIndex = regexp.lastIndex;
    tokens.push(<strong key={regexp.lastIndex}>{match[0]}</strong>);
  }
  const rest = text.slice(lastIndex);
  if (rest.length > 0) {
    tokens.push(rest);
  }
  return tokens;
}

// tslint:disable-next-line: max-classes-per-file
class PaymentPortal extends React.PureComponent<{}> {
  private externalWindow: Window | null;
  private containerEl: HTMLDivElement;
  // private timer: number;

  constructor(props: {}) {
    super(props);
    // STEP 1: create a container <div>
    this.containerEl = document.createElement('div');
    this.externalWindow = null;
  }

  render() {
    // STEP 2: append props.children to the container <div> that isn't mounted anywhere yet
    return ReactDOM.createPortal(this.props.children, this.containerEl);
  }

  componentDidMount() {
    // STEP 3: open a new browser window and store a reference to it
    this.externalWindow = window.open('', '', 'width=800,height=640,left=200,top=200');

    // STEP 4: append the container <div> (that has props.children appended to it) to the body of the new window
    if (this.externalWindow) {
      this.externalWindow.document.body.appendChild(this.containerEl);
    }
  }

  componentWillUnmount() {
    // STEP 5: This will fire when this.state.showWindowPortal in the parent component becomes false
    // So we tidy up by closing the window
    if (this.externalWindow) {
      this.externalWindow.close();
    }
  }
}
