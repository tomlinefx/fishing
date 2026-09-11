import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Linking from 'expo-linking';
import { messages } from '../../messages';
import { PhotoPicker } from '../PhotoPicker';

jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

jest.mock('expo-linking', () => ({ openSettings: jest.fn(async () => undefined) }));

const picker = {
  camera: jest.mocked(ImagePicker.requestCameraPermissionsAsync),
  library: jest.mocked(ImagePicker.requestMediaLibraryPermissionsAsync),
  launchCamera: jest.mocked(ImagePicker.launchCameraAsync),
  launchLibrary: jest.mocked(ImagePicker.launchImageLibraryAsync),
};

beforeEach(() => {
  jest.clearAllMocks();
});

async function renderPicker(photoUri: string | null = null, onPhotoSelected = jest.fn()) {
  await render(<PhotoPicker photoUri={photoUri} onPhotoSelected={onPhotoSelected} />);
  return onPhotoSelected;
}

describe('PhotoPicker', () => {
  it('カメラの許可が拒否されると案内と「設定を開く」を出し、設定画面を開ける（BR5.1）', async () => {
    picker.camera.mockResolvedValue({ granted: false } as never);
    const onPhotoSelected = await renderPicker();
    await fireEvent.press(screen.getByTestId('catch-form-photo-camera'));
    await waitFor(() => expect(screen.getByTestId('catch-form-photo-denied')).toBeTruthy());
    expect(screen.getByText(messages.form.permissionDenied)).toBeTruthy();
    expect(picker.launchCamera).not.toHaveBeenCalled();
    expect(onPhotoSelected).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByTestId('catch-form-photo-open-settings'));
    expect(Linking.openSettings).toHaveBeenCalledTimes(1);
  });

  it('許可されて撮影すると写真の参照を渡し、プレビューを出す（BR5.2: 許可は操作の直前）', async () => {
    picker.camera.mockResolvedValue({ granted: true } as never);
    picker.launchCamera.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///cache/shot.jpg' }],
    } as never);
    const onPhotoSelected = jest.fn();
    const { rerender } = await render(
      <PhotoPicker photoUri={null} onPhotoSelected={onPhotoSelected} />,
    );
    expect(picker.camera).not.toHaveBeenCalled(); // 起動時にはまとめて要求しない
    await fireEvent.press(screen.getByTestId('catch-form-photo-camera'));
    await waitFor(() => expect(onPhotoSelected).toHaveBeenCalledWith('file:///cache/shot.jpg'));
    await rerender(
      <PhotoPicker photoUri="file:///cache/shot.jpg" onPhotoSelected={onPhotoSelected} />,
    );
    expect(screen.getByTestId('catch-form-photo-preview').props.source).toEqual({
      uri: 'file:///cache/shot.jpg',
    });
    expect(screen.getByTestId('catch-form-photo-preview').props.accessibilityLabel).toBe(
      messages.form.photoPreviewAlt,
    );
  });

  it('ライブラリの許可が拒否されても同じ案内を出す（BR5.1）', async () => {
    picker.library.mockResolvedValue({ granted: false } as never);
    await renderPicker();
    await fireEvent.press(screen.getByTestId('catch-form-photo-library'));
    await waitFor(() => expect(screen.getByTestId('catch-form-photo-denied')).toBeTruthy());
    expect(picker.launchLibrary).not.toHaveBeenCalled();
  });

  it('選択をキャンセルすると何も渡さない', async () => {
    picker.library.mockResolvedValue({ granted: true } as never);
    picker.launchLibrary.mockResolvedValue({ canceled: true, assets: null } as never);
    const onPhotoSelected = await renderPicker();
    await fireEvent.press(screen.getByTestId('catch-form-photo-library'));
    await waitFor(() => expect(picker.launchLibrary).toHaveBeenCalledTimes(1));
    expect(onPhotoSelected).not.toHaveBeenCalled();
    expect(screen.queryByTestId('catch-form-photo-denied')).toBeNull();
  });

  it('取得に失敗すると記録して文言を出す（握りつぶさない）', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    picker.camera.mockRejectedValue(new Error('カメラが使えない'));
    await renderPicker();
    await fireEvent.press(screen.getByTestId('catch-form-photo-camera'));
    await waitFor(() =>
      expect(screen.getByTestId('catch-form-photo-failed')).toHaveTextContent(
        messages.form.photoPickFailed,
      ),
    );
    expect(errorSpy).toHaveBeenCalledTimes(1);
    errorSpy.mockRestore();
  });

  it('検証文言（写真必須）を直下に出す（BR1.1）', async () => {
    await render(
      <PhotoPicker
        photoUri={null}
        onPhotoSelected={jest.fn()}
        error={messages.errors.photoRequired}
      />,
    );
    expect(screen.getByTestId('catch-form-photo-error')).toHaveTextContent(
      messages.errors.photoRequired,
    );
  });
});
