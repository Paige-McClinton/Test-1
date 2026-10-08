import { Alert, Platform } from 'react-native';

/**
 * Shows a yes/no confirmation. Uses a native alert on iOS/Android and the
 * browser's confirm dialog on web (React Native's Alert does nothing on web).
 */
export function confirmAction(title: string, message: string, confirmLabel: string, onConfirm: () => void, destructive = true) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.confirm(`${title}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: confirmLabel, style: destructive ? 'destructive' : 'default', onPress: onConfirm },
  ]);
}
