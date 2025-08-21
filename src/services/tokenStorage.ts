import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'authToken';
const USER_KEY = 'userData';

export async function saveToken(token: string) {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token, { keychainService: 'sarjet.auth' });
  } catch {}
}

export async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY, { keychainService: 'sarjet.auth' });
  } catch {
    return null;
  }
}

export async function deleteToken() {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY, { keychainService: 'sarjet.auth' });
  } catch {}
}

export async function saveUser(user: any) {
  try {
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user), { keychainService: 'sarjet.user' });
  } catch {}
}

export async function getUser(): Promise<any | null> {
  try {
    const s = await SecureStore.getItemAsync(USER_KEY, { keychainService: 'sarjet.user' });
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}

export async function deleteUser() {
  try {
    await SecureStore.deleteItemAsync(USER_KEY, { keychainService: 'sarjet.user' });
  } catch {}
}

export default { saveToken, getToken, deleteToken, saveUser, getUser, deleteUser };


