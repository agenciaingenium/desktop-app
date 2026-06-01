import { Consumer } from '@getstation/sdk';
import { BxSDK } from '.';

export const isActiveConsumer = (namespace: string, manifestURL: string, sdk: BxSDK): boolean => {
  return (sdk as any)[namespace] &&
    (sdk as any)[namespace].provider._consumers.map((c: Consumer) => c.id).includes(manifestURL);
};
