import axios from "axios";
import Constants from "expo-constants";
import { Platform } from 'react-native';

// Obtener la URL del backend desde la configuración de Expo o usar la IP correcta
const getBackendUrl = () => {
    // 1) Tomar siempre lo que venga de app.config.js
    const url = Constants.expoConfig?.extra?.BACKEND_URL;

    if (!url) {
    console.warn(
      "⚠️ BACKEND_URL no está configurada en app.config.js. Intentando fallback según plataforma..."
    );

    if (__DEV__) {
      // En desarrollo intentamos derivar la IP automáticamente.
      // 1) Si Expo expone `manifest.debuggerHost`, lo usamos (útil en dispositivos físicos).
      const manifest: any = (Constants as any).manifest || (Constants as any).expoConfig;
      const debuggerHost = manifest && (manifest.debuggerHost || manifest.hostUri);
      if (debuggerHost && typeof debuggerHost === 'string') {
        // debuggerHost tiene formato '192.168.1.34:19000'
        const host = debuggerHost.split(':')[0];
        const inferred = `http://${host}:3000`;
        console.warn('⚠️ Usando BACKEND_URL inferida desde debuggerHost:', inferred);
        return inferred;
      }

      // 2) Fallbacks conocidos por plataforma
      const fallback = Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
      console.warn('⚠️ Usando BACKEND_URL fallback en desarrollo:', fallback);
      return fallback;
    }

    return undefined;
  }

  return url;
};

const BACKEND_URL = getBackendUrl();

console.log('🌐 Backend URL configurada:', BACKEND_URL);
console.log('📱 Expo Config extra:', Constants.expoConfig?.extra);
console.log('🔧 Modo desarrollo:', __DEV__);

export const api = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 segundos
});

// Interceptor para logging de requests
api.interceptors.request.use(
  (config) => {
    console.log(`📤 ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    // Loguear el content-type que se está enviando
    console.log(`📤 Content-Type: ${config.headers['Content-Type']}`);
    const authHeader = config.headers.Authorization;
    if (authHeader && typeof authHeader === 'string') {
      console.log('🔑 Con token:', authHeader.substring(0, 50) + '...');
    }
    if (config.data) {
      // No loguear el body completo si es muy grande
      const dataString = JSON.stringify(config.data);
      if (dataString.length > 500) {
        console.log(`📦 Data (grande): ${dataString.length} bytes. Keys: ${Object.keys(config.data)}`);
      } else {
        console.log('📦 Data:', dataString);
      }
    }
    return config;
  },
  (error) => {
    console.error('❌ Request error:', error);
    return Promise.reject(error);
  }
);

// Interceptor para logging de responses
api.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.status} ${response.config.url}`);
    console.log('📥 Response:', response.data);
    return response;
  },
  (error) => {
    if (error.code === 'ECONNABORTED') {
      console.error('⏱️ Request timeout después de 30 segundos');
    } else if (error.response) {
        const status = error.response.status;
        // Avoid noisy redbox logs for client errors (4xx) that we may handle locally
        if (status >= 400 && status < 500) {
          console.warn(`⚠️ ${status} ${error.config?.url}`);
          console.warn('📥 Error response:', error.response.data);
        } else {
          console.error(`❌ ${status} ${error.config?.url}`);
          console.error('📥 Error response:', error.response.data);
        }
    } else if (error.request) {
      console.error('❌ No se recibió respuesta del servidor');
      console.error('🔗 URL intentada:', error.config?.url);
    } else {
      console.error('❌ Error configurando request:', error.message);
    }
    return Promise.reject(error);
  }
);

// Manejo global del token
let authToken: string | undefined = undefined;

export function setAuthToken(token?: string) {
  authToken = token;
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    console.log('✅ Token configurado en axios');
  } else {
    delete api.defaults.headers.common["Authorization"];
    console.log('🗑️ Token removido de axios');
  }
}

// ==================== ENDPOINTS ====================

// Verificar si el servidor está vivo
export const checkHealth = async () => {
  console.log('🏥 Verificando salud del servidor...');
  const response = await api.get("/health");
  return response.data;
};

// 🆕 Registro de usuario
export const registerUser = async (userData: {
  nombre: string;
  email: string;
  password: string;
}) => {
  const response = await api.post("/auth/register", userData);
  return response.data;
};

// 🆕 Login de usuario
export const loginUser = async (credentials: {
  email: string;
  password: string;
}) => {
  const response = await api.post("/auth/login", credentials);
  return response.data;
};

// Sincronizar usuario de Firebase con backend
export const syncUserWithBackend = async (userData: {
  nombre: string;
  fechaNacimiento: string; // YYYY-MM-DD
  clave_pago?: string | null;
  foto_data?: string | null; // optional base64
  foto_url?: string | null; // optional client-provided URL
}) => {
  console.log('🔄 Iniciando sincronización con backend...');
  console.log('📦 Datos a enviar:', userData);

  try {
    const response = await api.post("/auth/sync-user", userData);
    console.log('✅ Sincronización exitosa');
    return response.data;
  } catch (error: any) {
    console.error('❌ Error en syncUserWithBackend:', error.message);
    throw error;
  }
};

// Obtener datos del usuario autenticado
export const getCurrentUser = async () => {
  const response = await api.get("/users/me");
  return response.data;
};

// Actualizar datos del usuario autenticado
export const updateUser = async (updateData: { nombre?: string; clave_pago?: string | null; foto_url?: string | null; foto_data?: string | null }) => {
  // 🔥 FIX: Cambiar de PUT a POST.
  // POST es más robusto para enviar bodies grandes y puede resolver
  // el problema donde express.json() no está parseando el body de PUT.
  const response = await api.post("/users/me", updateData, {
    headers: {
      'Content-Type': 'application/json'
    }
  });
  return response.data;
};

// Verificar disponibilidad de Alias/CVU (clave_pago)
export const checkClaveAvailable = async (clave: string) => {
  const response = await api.get('/users/clave-available', { params: { clave } });
  return response.data as { available: boolean };
};

// Test de conexión
export const testConnection = async () => {
  console.log('🧪 Probando conexión con backend...');
  try {
    const health = await checkHealth();
    console.log('✅ Backend respondió:', health);
    return true;
  } catch (error) {
    console.error('❌ No se pudo conectar al backend');
    return false;
  }
};
