// ルートレイアウト（AppShell）: 保存領域の準備 → スタック型の画面遷移
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { createProductionCatchLog } from '../src/catches/composition';
import { AppShell } from '../src/catches/ui/AppShell';

export default function RootLayout() {
  return (
    <AppShell createLog={createProductionCatchLog}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </AppShell>
  );
}
