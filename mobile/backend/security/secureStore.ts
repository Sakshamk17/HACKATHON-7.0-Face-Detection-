import * as Keychain from 'react-native-keychain';

export const saveSecureKey = async (
  key: string,
  value: string
): Promise<void> => {
  await Keychain.setGenericPassword(key, value, { service: key });
};

export const getSecureKey = async (
  key: string
): Promise<string | null> => {
  const creds = await Keychain.getGenericPassword({ service: key });
  if (!creds) return null;
  return creds.password;
};