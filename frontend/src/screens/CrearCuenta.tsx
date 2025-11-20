import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../contexts/AuthContext';
import { Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { checkClaveAvailable } from '../api/client';
import Constants from 'expo-constants';

export default function CrearCuenta({ navigation }: any) {
  const { register } = useAuth();
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [fecha, setFecha] = useState('');
  const [dateObj, setDateObj] = useState<Date | undefined>(undefined);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [clavePago, setClavePago] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [fotoBase64, setFotoBase64] = useState<string | null>(null);
  const [aceptaTyC, setAceptaTyC] = useState(false);
  const [loading, setLoading] = useState(false);

  const validarEmail = (correo: string) => /\S+@\S+\.\S+/.test(correo);

  function parseFechaInput(input: string): string {
    const trimmed = input.trim();
    if (!trimmed) return '';

    // Ya está en formato YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

    // Formato DD/MM/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
      const [d, m, y] = trimmed.split('/');
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }

    // Intentar parsear como fecha
    const dt = new Date(trimmed);
    if (!isNaN(dt.getTime())) {
      return dt.toISOString().slice(0, 10);
    }

    return trimmed;
  }

  const handleCrearCuenta = async () => {
    // Validaciones
    if (!nombre.trim()) {
      Alert.alert('Error', 'Por favor ingresa tu nombre completo.');
      return;
    }

    if (!email.trim()) {
      Alert.alert('Error', 'Por favor ingresa tu correo electrónico.');
      return;
    }

    if (!validarEmail(email)) {
      Alert.alert('Error', 'Por favor ingresa un correo electrónico válido.');
      return;
    }

    if (!fecha) {
      Alert.alert('Error', 'Por favor selecciona tu fecha de nacimiento.');
      return;
    }

    if (!clavePago.trim()) {
      Alert.alert('Error', 'Por favor ingresa tu Alias o CVU (clave de pago).');
      return;
    }

    if (clavePago.trim().length > 50) {
      Alert.alert('Error', 'El Alias/CVU no puede tener más de 50 caracteres.');
      return;
    }

    if (!password) {
      Alert.alert('Error', 'Por favor ingresa una contraseña.');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Error', 'La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (password !== confirmarPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden.');
      return;
    }

    if (!aceptaTyC) {
      Alert.alert('Error', 'Debes aceptar los términos y condiciones.');
      return;
    }

    setLoading(true);
    try {
      console.log('📝 Creando cuenta...');
      console.log('Email:', email);
      console.log('Nombre:', nombre);
      console.log('Fecha:', parseFechaInput(fecha));

      // Verificar disponibilidad del alias en backend antes de crear la cuenta
      try {
        const { available } = await checkClaveAvailable(clavePago.trim());
        if (!available) {
          Alert.alert('Error', 'El Alias/CVU ya está en uso. Elige otro.');
          setLoading(false);
          return;
        }
      } catch (err) {
        // Si falla la verificación por red, permitir continuar y confiar en la validación del servidor
        console.warn('No se pudo verificar disponibilidad del alias, se intentará crear igual', err);
      }

      // For profile photo, use server-side upload (same approach as receipts):
      // always read base64 and send to backend. This centralizes upload logic
      // and avoids client Blob/unsigned issues.
      let fotoToSend: string | null = null;
      if (imageUri && fotoBase64) {
        fotoToSend = fotoBase64;
        console.log('Enviar foto en base64 al backend (CrearCuenta), tamaño:', fotoToSend.length);
      }

      // Usar el register del AuthContext que maneja Firebase + Backend
      await register(
        email.trim(),
        password,
        nombre.trim(),
        parseFechaInput(fecha),
        clavePago.trim(),
        fotoToSend
      );

      console.log('✅ Cuenta creada exitosamente');

      // Mostrar mensaje de éxito
      Alert.alert(
        'Cuenta creada',
        'Te hemos enviado un email de verificación. Por favor verifica tu correo antes de iniciar sesión.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('InicioSesion')
          }
        ]
      );
    } catch (err: any) {
      console.error('❌ Error al crear cuenta:', err);

      let errorMessage = 'Ocurrió un error al crear la cuenta.';

      // Errores de Firebase Auth
      if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'Este correo ya está registrado.';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'La contraseña es muy débil. Usa al menos 8 caracteres.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'El correo electrónico no es válido.';
      } else if (err.code === 'auth/operation-not-allowed') {
        errorMessage = 'El registro de usuarios no está habilitado.';
      } else if (err.code === 'auth/network-request-failed') {
        errorMessage = 'Error de conexión. Verifica tu internet.';
      }
      // Errores del backend
      else if (err.response?.status === 409) {
        errorMessage = 'El correo ya está en uso en el sistema.';
      } else if (err.response?.status === 401) {
        errorMessage = 'Error de autenticación con el servidor.';
      } else if (err.response?.status === 403) {
        errorMessage = 'Error de permisos. Contacta al soporte.';
      } else if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        errorMessage = 'El servidor no responde. Verifica tu conexión o intenta más tarde.';
      } else if (err.response) {
        errorMessage = `Error del servidor (${err.response.status}). Intenta nuevamente.`;
      }
      // Error de red
      else if (err.message?.includes('Network')) {
        errorMessage = 'No se pudo conectar con el servidor. Verifica tu conexión.';
      }

      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoid}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Crear Cuenta</Text>
        <Text style={styles.subtitle}>
          Únete y comienza a gestionar gastos compartidos
        </Text>

        {/* Foto de perfil (opcional) */}
        <Text style={styles.label}>Foto de perfil (opcional)</Text>
        <TouchableOpacity
          onPress={async () => {
            try {
              const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
              if (!permission.granted) {
                Alert.alert('Permiso requerido', 'Se necesita permiso para acceder a la galería');
                return;
              }

              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.8
              });

              if ('canceled' in result && result.canceled) return;

              const uri = (result as any).assets?.[0]?.uri as string | undefined;
              if (!uri) return;
              setImageUri(uri);

              // Leer base64 para ser enviado al backend
              try {
                const b64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
                setFotoBase64(b64);
              } catch (fsErr) {
                console.warn('No se pudo leer la imagen en base64', fsErr);
                setFotoBase64(null);
              }
            } catch (err) {
              console.error('Error seleccionando imagen', err);
            }
          }}
          style={[styles.input, { alignItems: 'center', justifyContent: 'center', height: 120 }]}
          disabled={loading}
        >
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={{ width: 100, height: 100, borderRadius: 50 }} />
          ) : (
            <Text style={{ color: '#666' }}>Tocar para seleccionar una foto</Text>
          )}
        </TouchableOpacity>

        {/* Nombre completo */}
        <Text style={styles.label}>Nombre completo</Text>
        <TextInput
          style={styles.input}
          placeholder="Tu nombre completo"
          placeholderTextColor="#999"
          value={nombre}
          onChangeText={setNombre}
          editable={!loading}
          autoCapitalize="words"
          autoCorrect={false}
        />

        {/* Correo electrónico */}
        <Text style={styles.label}>Correo electrónico</Text>
        <TextInput
          style={styles.input}
          placeholder="tu@email.com"
          placeholderTextColor="#999"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          editable={!loading}
          autoCorrect={false}
        />

        {/* Alias / CVU */}
        <Text style={styles.label}>Alias / CVU</Text>
        <TextInput
          style={styles.input}
          placeholder="Alias o CVU (ej. mi_alias_123)"
          placeholderTextColor="#999"
          autoCapitalize="none"
          value={clavePago}
          onChangeText={setClavePago}
          editable={!loading}
          autoCorrect={false}
        />

        {/* Fecha de nacimiento */}
        <Text style={styles.label}>Fecha de nacimiento</Text>
        <TouchableOpacity
          onPress={() => !loading && setShowDatePicker(true)}
          style={[styles.input, styles.dateInput]}
          disabled={loading}
        >
          <Text style={[styles.dateText, !fecha && styles.placeholderText]}>
            {fecha || 'Seleccionar fecha'}
          </Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={dateObj || new Date(2000, 0, 1)}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            maximumDate={new Date()}
            minimumDate={new Date(1900, 0, 1)}
            onChange={(event: any, selectedDate?: Date) => {
              if (Platform.OS === 'android') {
                setShowDatePicker(false);
              }
              if (selectedDate) {
                setDateObj(selectedDate);
                const d = selectedDate.getDate().toString().padStart(2, '0');
                const m = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
                const y = selectedDate.getFullYear();
                setFecha(`${d}/${m}/${y}`);
              }
            }}
          />
        )}

        {/* Contraseña */}
        <Text style={styles.label}>Contraseña</Text>
        <TextInput
          style={styles.input}
          placeholder="Mínimo 8 caracteres"
          placeholderTextColor="#999"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          editable={!loading}
          autoCapitalize="none"
          autoCorrect={false}
        />

        {/* Confirmar contraseña */}
        <Text style={styles.label}>Confirmar contraseña</Text>
        <TextInput
          style={styles.input}
          placeholder="Repite tu contraseña"
          placeholderTextColor="#999"
          secureTextEntry
          value={confirmarPassword}
          onChangeText={setConfirmarPassword}
          editable={!loading}
          autoCapitalize="none"
          autoCorrect={false}
        />

        {/* Términos y condiciones */}
        <TouchableOpacity
          onPress={() => !loading && setAceptaTyC(!aceptaTyC)}
          style={styles.tycContainer}
          disabled={loading}
        >
          <View style={[styles.checkbox, aceptaTyC && styles.checkboxChecked]}>
            {aceptaTyC && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.tycText}>
            Acepto los{' '}
            <Text
              style={styles.link}
              onPress={() => !loading && Alert.alert('Términos y Condiciones', 'Aquí irían los términos y condiciones')}
            >
              términos y condiciones
            </Text>
          </Text>
        </TouchableOpacity>

        {/* Botón crear cuenta */}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleCrearCuenta}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Crear Cuenta</Text>
          )}
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>¿Ya tienes cuenta? </Text>
          <TouchableOpacity
            onPress={() => !loading && navigation.navigate('InicioSesion')}
            disabled={loading}
          >
            <Text style={styles.link}>Iniciar sesión</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
    backgroundColor: '#E6F4F1',
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#033E30',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  label: {
    alignSelf: 'flex-start',
    marginBottom: 8,
    fontWeight: '600',
    color: '#033E30',
    fontSize: 14,
  },
  input: {
    width: '100%',
    backgroundColor: '#FFF',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD',
    marginBottom: 16,
    fontSize: 16,
    color: '#000',
  },
  dateInput: {
    justifyContent: 'center',
  },
  dateText: {
    fontSize: 16,
    color: '#000',
  },
  placeholderText: {
    color: '#999',
  },
  tycContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    alignSelf: 'flex-start',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#033E30',
    marginRight: 10,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#033E30',
    borderColor: '#033E30',
  },
  checkmark: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  tycText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  link: {
    color: '#007B5E',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  button: {
    width: '100%',
    backgroundColor: '#033E30',
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },
  footerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  footerText: {
    color: '#555',
  },
});
