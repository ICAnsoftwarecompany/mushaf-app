import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/use-theme';
import ThemePicker from '@/theme/ThemePicker';

export default function SettingsScreen() {
  const colors = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ThemePicker />
    </SafeAreaView>
  );
}
