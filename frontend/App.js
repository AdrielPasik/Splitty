import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator, StyleSheet, Alert, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PantallaBienvenida from './src/screens/PantallaBienvenida';
import InicioSesion from './src/screens/InicioSesion';
import CrearCuenta from './src/screens/CrearCuenta';
import RestablecerContraseña from './src/screens/RestablecerContraseña';
import CrearGrupo from './src/screens/CrearGrupo';
import UnirseGrupo from './src/screens/UnirseGrupo';
import Grupo from './src/screens/Grupo';
import AddGasto from './src/screens/AddGasto';
import ConfiguracionGrupo from './src/screens/ConfiguracionGrupo';
import MainTabs from './src/navigation/MainTabs';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { ProfileProvider } from './src/contexts/ProfileContext';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { NetworkProvider } from './src/contexts/NetworkContext';
import EscanearAmigo from './src/screens/EscanearAmigo';
import { api } from './src/api/client';
import InlineAlertHost from './src/components/InlineAlert';

const Stack = createNativeStackNavigator();

function AppNavigator() {
  // 🔥 FIX 1: Tu AuthContext usa 'isLoading', no 'loading'
  const { user, isLoading } = useAuth();

  useEffect(() => {
    const handleDeepLink = async (event) => {
      try {
        const url = event?.url || event;
        console.log('🔗 Deep link recibido:', url);

        const urlObj = new URL(url);
        const path = urlObj.hostname || urlObj.pathname.replace('//', '');

        if (path === 'join') {
          const groupId = urlObj.searchParams.get('groupId');
          const inviteId = urlObj.searchParams.get('inviteId');

          console.log('📋 Datos extraídos:', { groupId, inviteId });

          if (!groupId || !inviteId) {
            Alert.alert('Link inválido', 'Este link de invitación no es válido');
            return;
          }

          if (!user) {
            await AsyncStorage.setItem('pendingInvite', JSON.stringify({ groupId, inviteId }));
            Alert.alert('Inicia sesión', 'Primero debes iniciar sesión para unirte al grupo');
            return;
          }

          handleJoinGroup(groupId, inviteId);
        }
      } catch (error) {
        console.error('❌ Error procesando deep link:', error);
        Alert.alert('Error', 'No se pudo procesar la invitación');
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);

    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('🚀 App abierta con deep link:', url);
        handleDeepLink(url);
      }
    });

    return () => subscription.remove();
  }, [user]);

  useEffect(() => {
    if (user) {
      checkPendingInvite();
    }
  }, [user]);

  const checkPendingInvite = async () => {
    try {
      const pending = await AsyncStorage.getItem('pendingInvite');
      if (pending) {
        const { groupId, inviteId } = JSON.parse(pending);
        await AsyncStorage.removeItem('pendingInvite');
        console.log('📌 Procesando invitación pendiente:', { groupId, inviteId });
        handleJoinGroup(groupId, inviteId);
      }
    } catch (error) {
      console.error('❌ Error checking pending invite:', error);
    }
  };

  const handleJoinGroup = async (groupId, inviteId) => {
    try {
      console.log('🔄 Uniéndose al grupo:', { groupId, inviteId });

      const response = await api.post('/grupos/join-by-invite', {
        groupId,
        inviteId
      });

      console.log('✅ Respuesta del servidor:', response.data);

      if (response.data.alreadyMember) {
        Alert.alert('Ya sos miembro', 'Ya formás parte de este grupo');
      } else {
        Alert.alert(
          '¡Bienvenido!',
          'Te uniste al grupo correctamente',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('❌ Error joining group:', error);

      let message = 'No se pudo unir al grupo';
      const errorCode = error?.response?.data?.error;

      if (errorCode === 'INVITE_EXPIRED') {
        message = 'Esta invitación ya expiró. Pedí una nueva al administrador.';
      } else if (errorCode === 'INVITE_NOT_FOUND') {
        message = 'Invitación no encontrada. Verificá el código.';
      } else if (errorCode === 'INVITE_ALREADY_USED') {
        message = 'Esta invitación ya fue utilizada.';
      } else if (errorCode === 'GROUP_NOT_FOUND') {
        message = 'El grupo ya no existe.';
      }

      Alert.alert('Error', message);
    }
  };

  // 🔥 FIX 2: Usar 'isLoading' (el nombre correcto)
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#033E30" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <>
          <Stack.Screen key="Main" name="Main" component={MainTabs} />
          <Stack.Screen key="CrearGrupo" name="CrearGrupo" component={CrearGrupo} />
          <Stack.Screen key="UnirseGrupo" name="UnirseGrupo" component={UnirseGrupo} />
          <Stack.Screen key="Grupo" name="Grupo" component={Grupo} />
          <Stack.Screen key="DebtDetail" name="DebtDetail" component={require('./src/screens/DebtDetail').default} />
          <Stack.Screen key="InvitarMiembro" name="InvitarMiembro" component={require('./src/screens/InvitarMiembro').default} />
          <Stack.Screen key="AddGasto" name="AddGasto" component={AddGasto} />
          <Stack.Screen key="PantallaPerfil" name="PantallaPerfil" component={require('./src/screens/PantallaPerfil').default} />
          <Stack.Screen name="EscanearAmigo" component={EscanearAmigo} options={{ headerShown: false }} />
          <Stack.Screen key="ConfiguracionGrupo" name="ConfiguracionGrupo" component={ConfiguracionGrupo} />
        </>
      ) : (
        <>
          <Stack.Screen key="PantallaBienvenida" name="PantallaBienvenida" component={PantallaBienvenida} />
          <Stack.Screen key="InicioSesion" name="InicioSesion" component={InicioSesion} />
          <Stack.Screen key="CrearCuenta" name="CrearCuenta" component={CrearCuenta} />
          <Stack.Screen key="RestablecerContraseña" name="RestablecerContraseña" component={RestablecerContraseña} />
        </>
      )}
    </Stack.Navigator>
  );
}

const App = () => (
  <ThemeProvider>
    {/* NetworkProvider envuelve providers que usan NetInfo */}
    <NetworkProvider>
      {/* 🔥 FIX 3: Cambiado el orden. ProfileProvider debe envolver a AuthProvider */}
      <ProfileProvider>
        <AuthProvider>
          <NavigationContainer>
            <AppNavigator />
            <InlineAlertHost />
          </NavigationContainer>
        </AuthProvider>
      </ProfileProvider>
    </NetworkProvider>
  </ThemeProvider>
);

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E6F4F1',
  },
});

export default App;