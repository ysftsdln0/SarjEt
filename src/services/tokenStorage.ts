import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'authToken';
const USER_KEY = 'userData';

export async function saveToken(token: string): Promise<boolean> {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token, { keychainService: 'sarjet.auth' });
    return true;
  } catch (error) {
    console.error('Failed to save token:', error);
    return false;
  }
}

export async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY, { keychainService: 'sarjet.auth' });
  } catch (error) {
    console.error('Failed to get token:', error);
    return null;
  }
}

export async function deleteToken(): Promise<boolean> {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY, { keychainService: 'sarjet.auth' });
    return true;
  } catch (error) {
    console.error('Failed to delete token:', error);
    return false;
  }
}

export async function saveUser(user: any): Promise<boolean> {
  try {
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user), { keychainService: 'sarjet.user' });
    return true;
  } catch (error) {
    console.error('Failed to save user:', error);
    return false;
  }
}

export async function getUser(): Promise<any | null> {
  try {
    const s = await SecureStore.getItemAsync(USER_KEY, { keychainService: 'sarjet.user' });
    return s ? JSON.parse(s) : null;
  } catch (error) {
    console.error('Failed to get user:', error);
    return null;
  }
}

export async function deleteUser(): Promise<boolean> {
  try {
    await SecureStore.deleteItemAsync(USER_KEY, { keychainService: 'sarjet.user' });
    return true;
  } catch (error) {
    console.error('Failed to delete user:', error);
    return false;
  }
}

export default { saveToken, getToken, deleteToken, saveUser, getUser, deleteUser };


