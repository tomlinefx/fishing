// S2 登録のルート。スケルトン段階では架空の写真を添付済みとして渡す（Step 10 で PhotoPicker に置き換える）。
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { CatchFormScreen } from '../src/catches/ui/CatchFormScreen';
import { ensureSkeletonPlaceholderPhoto } from '../src/catches/ui/skeleton-placeholder-photo';

export default function NewCatchRoute() {
  const router = useRouter();
  const placeholderPhotoUri = useMemo(() => ensureSkeletonPlaceholderPhoto(), []);
  return (
    <CatchFormScreen
      initialPhotoUri={placeholderPhotoUri}
      onSaved={() => router.back()}
      onCancel={() => router.back()}
    />
  );
}
