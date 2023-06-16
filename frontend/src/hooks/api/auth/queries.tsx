import { useMutation, useQuery } from '@tanstack/react-query';

import { saveTokenToLocalStorage } from '@app/components/utilities/saveTokenToLocalStorage';
import { apiRequest } from '@app/config/request';
import { setAuthToken } from '@app/reactQuery';
import KeyService from '@app/services/KeyService';

// import terminusToken from '@app/pages/api/auth/CheckTerminusToken';
import {
  // GetAuthTokenAPI,
  GetAuthTokenAPIExt,
  SendMfaTokenDTO,
  VerifyMfaTokenDTO,
  VerifyMfaTokenRes} from './types';

const authKeys = {
  getAuthToken: ['token'] as const,
};

export const useSendMfaToken = () => {
  return useMutation<{}, {}, SendMfaTokenDTO>({
    mutationFn: async ({ email }) => {
      const { data } = await apiRequest.post('/api/v2/auth/mfa/send', { email });
      return data;
    }
  });
}

export const useVerifyMfaToken = () => {
  return useMutation<VerifyMfaTokenRes, {}, VerifyMfaTokenDTO>({
    mutationFn: async ({ email, mfaCode }) => {
      const { data } = await apiRequest.post('/api/v2/auth/mfa/verify', {
        email,
        mfaToken: mfaCode
      });
      return data;
    }
  });
}

// Refresh token is set as cookie when logged in
// Using that we fetch the auth bearer token needed for auth calls
const fetchPrivateKey = (secretKey?:string) => {
  return async () => {
    const { data } = await apiRequest.post<VerifyMfaTokenRes>('/tapr/privatekey', undefined, {
        withCredentials: true
    });
    if (secretKey !== undefined ){
      // decrypt private key and save
      const privateKey = await KeyService.decryptPrivateKey({
        encryptionVersion: data.encryptionVersion,  // must be 1
        encryptedPrivateKey: data.encryptedPrivateKey,
        iv: data.iv,
        tag: data.tag,
        password: secretKey,
        salt: "",
        protectedKey: data.protectedKey,
        protectedKeyIV: data.protectedKeyIV,
        protectedKeyTag: data.protectedKeyTag
      });

      saveTokenToLocalStorage({
        publicKey: data.publicKey,
        encryptedPrivateKey: data.encryptedPrivateKey,
        iv: data.iv,
        tag: data.tag,
        privateKey
      });
        
    }else{
      throw new Error("Invalid secret key, cannot descrypt private key");
    }

    return data;
  };
};

const fetchAuthToken = async () => {
  //  const { data } = await apiRequest.post<GetAuthTokenAPI>('/api/v1/auth/token', undefined, {
    const { data } = await apiRequest.post<GetAuthTokenAPIExt>('/tapr/auth/token', undefined, {
        withCredentials: true
    });
  
    await fetchPrivateKey(data.secretKey)();
  
    return data;
  };
    
export const useGetAuthToken = () =>
  useQuery(authKeys.getAuthToken, fetchAuthToken, {
    onSuccess: (data) => setAuthToken(data.token),
    retry: 0
  });
