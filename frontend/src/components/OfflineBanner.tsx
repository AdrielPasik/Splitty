import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetwork } from '../contexts/NetworkContext';

const { width } = Dimensions.get('window');
const isSmallDevice = width < 375;

export default function OfflineBanner() {
  const { isConnected, isInternetReachable } = useNetwork();
  const insets = useSafeAreaInsets();

  // Si hay conexión, no mostrar nada
  if (isConnected && isInternetReachable) {
    return null;
  }

  // Estilos dinámicos
  const dynamicStyles = {
    fontSize: isSmallDevice ? 12 : 13,
    iconSize: isSmallDevice ? 14 : 16,
    paddingVertical: isSmallDevice ? 6 : 8,
    paddingHorizontal: isSmallDevice ? 12 : 16,
  };

  return (
    <View
      style={[
        styles.banner,
        {
          // ✅ Padding top dinámico para respetar el notch/Dynamic Island
          paddingTop: Math.max(insets.top, dynamicStyles.paddingVertical),
          paddingBottom: dynamicStyles.paddingVertical,
          paddingHorizontal: dynamicStyles.paddingHorizontal,
        },
      ]}
    >
      <Feather
        name="wifi-off"
        size={dynamicStyles.iconSize}
        color="#FFF"
      />
      <Text
        style={[
          styles.text,
          { fontSize: dynamicStyles.fontSize }
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        Modo offline - Mostrando datos guardados
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#FF9800',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  text: {
    color: '#FFF',
    fontWeight: '600',
    marginLeft: 8,
    flexShrink: 1, // ✅ Permite que el texto se ajuste en pantallas pequeñas
  },
});