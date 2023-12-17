/**
 * @class CommonModel
 * @description environment running, note (require environment nameming is lowercase)
 */
export enum Environment {
  local = 'local',
  production = 'production',
  staging = 'staging',
  dev = 'dev',
  test = 'test',
}

export enum DataType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
}

export enum Strategy {
  ClientId = 'x-sotatek-client-id',
  ClientSecret = 'x-sotatek-client-secret',
  ClientDevice = 'x-sotatek-device',
}

export enum ServiceOption {
  CORE = 'core',
  AUTH = 'auth',
  EDGE = 'edge',
  NOTIFY = 'notify',
  BILLING = 'billing',
  SUPPORT = 'support',
  SHIPMENT = 'shipment',
  WHOLESALER = 'wholesaler',
  TRADE_CREDIT = 'trade-credit',
  SUBSCRIPTION = 'subscription',
}
