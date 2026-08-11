import axios from 'axios';

const AUTHORIZE_NET_URL = process.env.AUTHORIZENET_ENV === 'production'
  ? 'https://api2.authorize.net/xml/v1/request.api'
  : 'https://apitest.authorize.net/xml/v1/request.api';

const requireCredentials = () => {
  const required = ['AUTHORIZENET_LOGIN_ID', 'AUTHORIZENET_TRANSACTION_KEY'];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) throw new Error(`Missing Authorize.net credentials: ${missing.join(', ')}`);
};

export const chargeAuthorizeNet = async ({ amount, opaqueData }) => {
  requireCredentials();
  if (!opaqueData?.dataDescriptor || !opaqueData?.dataValue) {
    throw new Error('A valid Authorize.net payment nonce is required');
  }

  const response = await axios.post(AUTHORIZE_NET_URL, {
    createTransactionRequest: {
      merchantAuthentication: {
        name: process.env.AUTHORIZENET_LOGIN_ID,
        transactionKey: process.env.AUTHORIZENET_TRANSACTION_KEY,
      },
      transactionRequest: {
        transactionType: 'authCaptureTransaction',
        amount: Number(amount).toFixed(2),
        payment: {
          opaqueData: {
            dataDescriptor: opaqueData.dataDescriptor,
            dataValue: opaqueData.dataValue,
          },
        },
      },
    },
  }, { headers: { 'Content-Type': 'application/json' } });

  const result = response.data?.transactionResponse;
  const approved = response.data?.messages?.resultCode === 'Ok' && result?.responseCode === '1';
  if (!approved) {
    const message = result?.errors?.[0]?.errorText || response.data?.messages?.message?.[0]?.text || 'Authorize.net payment was declined';
    const error = new Error(message);
    error.details = response.data;
    throw error;
  }

  return { transactionId: result.transId, response: result };
};
