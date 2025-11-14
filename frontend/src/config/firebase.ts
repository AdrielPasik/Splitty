import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyBA-LCc-LBjbTuv2Uw3v4UpOm-yzIhtOWg",
  authDomain: "splitty-102b4.firebaseapp.com",
  projectId: "splitty-102b4",
  storageBucket: "splitty-102b4.firebasestorage.app",
  messagingSenderId: "616662074521",
  appId: "1:616662074521:web:c8dd41c8cf51fadc912408"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Configurar Auth
// Nota: en este proyecto evitamos importar 'firebase/auth/react-native'
// directamente (no está presente en todas las instalaciones). Usamos
// `getAuth(app)` que funciona en la mayoría de entornos React Native.
// Si necesitás persistencia con AsyncStorage, podemos reintroducirla
// cuando la dependencia esté presente o migrar a `@react-native-firebase`.
const auth = getAuth(app);

// Configurar Firestore
const db = getFirestore(app);
// Nota: en versiones recientes del SDK modular la opción
// `experimentalForceLongPolling` ya no se exporta directamente.
// Si se necesita forzar long-polling en React Native, puede aplicarse
// mediante un cast a `any` o usando `initializeFirestore` con settings.
// Por ahora dejamos la configuración por defecto.

// Configurar Storage
const storage = getStorage(app);

export { auth, db, storage };
export default app;
