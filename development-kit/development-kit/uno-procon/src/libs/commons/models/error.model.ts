export interface ResponseError {
  name?: string;
  code: string;
  message?: string;
  errors?: any;
}

export interface BaseOptionError {
  type?: string;
  code?: string;
  status?: number;
  message?: string;
  error?: any;
}
