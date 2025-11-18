import { api as mockApi, MockSocket } from '../../services/mockService';
import { api as realApi, createSocket as createRealSocket } from './realService';
import { config } from '../config';

// Export the implementation based on config
export const api = config.useMock ? mockApi : realApi;

export const createSocket = () => {
  return config.useMock ? new MockSocket() : createRealSocket();
};