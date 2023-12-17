/* eslint-disable no-useless-escape */
export const PatternLib = {
  name: /^\w+[A-Za-z\s\d]+$/,
  nameSpecial: /[~!@#$%^&*()-+=<>,?\/\\:;"']/,
  email: /^[_A-Za-z0-9-]+(\.[_A-Za-z0-9-]+)*@[A-Za-z0-9]+(\.[A-Za-z0-9]+)*(\.[A-Za-z]{2,})$/,
  phone: /^(\+?84|0)(1[2689]|[89])[0-9]{8}$/,
  number: /^\d+$/,
  domainSession: /^https?:\/\/.*?domain.com$/,
  swaggerIgnore: /^https?:\/\/.*?domain.com\/document\/\?url.*$/,
};
