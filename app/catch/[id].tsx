// S3 詳細のルート。URL の id で1件を表示し、戻る・削除完了で一覧へ戻る。
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CatchDetailScreen } from '../../src/catches/ui/CatchDetailScreen';

export default function CatchDetailRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(params.id) ? (params.id[0] ?? '') : (params.id ?? '');
  return <CatchDetailScreen id={id} onBack={() => router.back()} onDeleted={() => router.back()} />;
}
