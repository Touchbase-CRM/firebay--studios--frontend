// utils/cookieUtils.js
import Cookies from 'js-cookie';

const COOKIE_EXPIRATION_DAYS = 1 / 96; // 15 minutes

export const getCookie = (key, defaultValue) => {
  const value = Cookies.get(key);
  if (value === undefined) {
    return defaultValue;
  }

  try {
    // This will handle parsing arrays and objects properly
    return JSON.parse(value);
  } catch (e) {
    // If it's not a JSON string, return the raw value
    return value;
  }
};

export const setCookie = (key, value) => {
  const valueToStore = typeof value === 'string' ? value : JSON.stringify(value);
  Cookies.set(key, valueToStore, { expires: COOKIE_EXPIRATION_DAYS });
};
