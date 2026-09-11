// S2 登録のルート。保存・キャンセルで一覧へ戻る（一覧は focus 時に再取得する）。
import { useRouter } from 'expo-router';
import { CatchFormScreen } from '../src/catches/ui/CatchFormScreen';

export default function NewCatchRoute() {
  const router = useRouter();
  return <CatchFormScreen onSaved={() => router.back()} onCancel={() => router.back()} />;
}
