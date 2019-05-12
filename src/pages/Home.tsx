import React, { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet';

import { Header, ItemsList, StoreButtons } from '../components/index';
import * as api from '../utility/api';

import { Product } from '../types';
import './Home.scss';

const LIMIT = 90;

const tags = ['onova'];

const tagsQueries = tags.map(t => `tags[]=${t}`).join('&');

const aprilDay = +new Date('2019-04-13');
const counterInitialNum = Math.floor((+new Date() - aprilDay) / 10000 / 60) + 2000;

function Home() {
  const [data, setData] = useState<Product[]>([]);
  const [counter, setCounter] = useState(counterInitialNum);

  const fetchData = async () => {
    try {
      const result = await api.getProducts(`?limit=${LIMIT}&${tagsQueries}`);
      setData(result);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useInterval(() => {
    setCounter(counter + Math.floor(Math.random() * Math.floor(4)));
  }, 2000);

  return (
    <div className="home-page">
      <Helmet title="Onova - Одяг та аксесуари українських брендів" />
      <Header />
      <StoreButtons classNames="pb-3 text-center" />
      <ItemsList items={data} />
      {data.length > 0 && (
        <p style={{ fontSize: 'xx-large' }} className="pb-4 text-center">
          . . .
        </p>
      )}
      {/* {data.length > 0 && (
        <p style={{ fontSize: 'xx-large' }} className="pb-4 text-center">
          Речей на платформі: <span className="counter">{counter}</span>
        </p>
      )} */}
      <footer className="py-4 text-center">
        <div className="py-3">
          <img style={{ width: '75px' }} className="px-2" alt="visa-logo" src={require('../images/visa.svg')} />
          <img
            style={{ width: '50px' }}
            className="px-2"
            alt="mastercard-logo"
            src={require('../images/mastercard.svg')}
          />
          <img style={{ width: '110px' }} alt="pci-logo" className="px-2" src={require('../images/pci.svg')} />
          <img style={{ width: '65px' }} alt="uapay-logo" className="px-2" src={require('../images/uapay.png')} />
        </div>
        <div>
          <a rel="noopener noreferrer" title="FAQ" href="https://onova.co/faq.html" target="_blank">
            Поширені запитання
          </a>{' '}
          <a
            rel="noopener noreferrer"
            title="Safe purchase rules"
            href="https://onova.co/safe-purchase-rules.html"
            target="_blank">
            Безпечна Угода
          </a>{' '}
          <a
            rel="noopener noreferrer"
            title="Terms and conditions"
            href="https://onova.co/terms-and-condition.html"
            target="_blank">
            Оферта
          </a>{' '}
          <a
            rel="noopener noreferrer"
            title="Privacy Policy"
            href="https://onova.co/privacy-policy.html"
            target="_blank">
            Політика конфіденційності
          </a>
        </div>
      </footer>
    </div>
  );
}

export default Home;

const noop = () => {};

function useInterval(callback: () => void, delay: number | null, immediate?: boolean) {
  const savedCallback = useRef(noop);

  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback;
  });

  // Execute callback if immediate is set.
  useEffect(() => {
    if (!immediate) return;
    if (delay === null) return;
    savedCallback.current();
  }, [delay, immediate]);

  // Set up the interval.
  useEffect(() => {
    if (delay === null) return undefined;
    const tick = () => savedCallback.current();
    const id = setInterval(tick, delay);
    return () => clearInterval(id);
  }, [delay]);
}
