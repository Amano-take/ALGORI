/**
 * @interface AppEnvironment
 * @since 2018/03/21
 */

export interface AppEnvironment {
  NAME: string;
  APP: {
    METHOD: string;
    HOST: string;
    PORT: number;
    TEST_PORT: number;
    IP: string;
  };
  SECURE: {
    JWT: {
      JWT_SECRET: string;
      TOKEN_EXPIRE: number;
    };
  };
  DATABASE: {
    MONGODB: {
      USERNAME: string;
      PASSWORD: string;
      HOST: string;
      PORT: number;
      NAME: string;
    };
    REDIS: {
      HOST: string;
      PORT: number;
      DB: number;
    };
  };
  IMAGE_STORE: {
    HOST: string;
    ROOT: string;
    BUCKET: string;
  };
}
