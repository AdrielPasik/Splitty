import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { useNetwork } from '../contexts/NetworkContext';

const { width } = Dimensions.get('window');
const isSmallDevice = width < 375;

interface CacheIndicatorProps {
  visible: boolean;
  onRefresh?: () => void;
  message?: string;
}

export default function CacheIndicator({
  visible,
  onRefresh,
  message = 'Datos guardados localmente'
}: CacheIndicatorProps) {
  const { colors } = useTheme();
  const { isConnected, isInternetReachable } = useNetwork();
  const insets = useSafeAreaInsets();

  const isOnline = isConnected && isInternetReachable;

  if (!visible) return null;

  // Estilos dinámicos
  const dynamicStyles = {
    fontSize: isSmallDevice ? 11 : 12,
    iconSize: isSmallDevice ? 12 : 14,
    paddingVertical: isSmallDevice ? 6 : 8,
    paddingHorizontal: isSmallDevice ? 12 : 16,
    buttonFontSize: isSmallDevice ? 11 : 12,
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.successLight,
          // ✅ No necesita paddingTop aquí porque ya está después del header
          paddingVertical: dynamicStyles.paddingVertical,
          paddingHorizontal: dynamicStyles.paddingHorizontal,
        }
      ]}
    >
      <View style={styles.content}>
        <Feather
          name="database"
          size={dynamicStyles.iconSize}
          color={colors.success}
        />
        <Text
          style={[
            styles.text,
            {
              color: colors.success,
              fontSize: dynamicStyles.fontSize
            }
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {message}
        </Text>
        {isOnline && onRefresh && (
          <TouchableOpacity
            onPress={onRefresh}
            style={styles.button}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather
              name="refresh-cw"
              size={dynamicStyles.iconSize}
              color={colors.primary}
            />
            <Text
              style={[
                styles.buttonText,
                {
                  color: colors.primary,
                  fontSize: dynamicStyles.buttonFontSize
                }
              ]}
            >
              Actualizar
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // Padding se aplica dinámicamente
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    flexWrap: 'wrap', // ✅ Permite que se envuelva en pantallas muy pequeñas
  },
  text: {
    fontWeight: '600',
    marginLeft: 8,
    flexShrink: 1, // ✅ Permite que el texto se ajuste
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  buttonText: {
    fontWeight: '700',
    marginLeft: 4,
  },
});