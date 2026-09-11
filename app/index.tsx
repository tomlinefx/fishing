// S1 一覧のルート。画面に戻ってくるたびに再取得する（絞り込みは画面側で保持）。
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { CatchListScreen } from '../src/catches/ui/CatchListScreen';

export default function IndexRoute() {
  const router = useRouter();
  const [reloadToken, setReloadToken] = useState(0);
  const isFirstFocus = useRef(true);

  useFocusEffect(
    useCallback(() => {
      if (isFirstFocus.current) {
        isFirstFocus.current = false; // 初回は画面の mount 時の取得に任せる
        return;
      }
      setReloadToken((token) => token + 1);
    }, []),
  );

  return (
    <CatchListScreen
      reloadToken={reloadToken}
      onAddPress={() => router.push('/new')}
      onCatchPress={(id) => router.push(`/catch/${id}`)}
    />
  );
}
