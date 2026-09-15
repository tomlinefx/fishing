// S2 登録画面（WF-1）: 写真必須、項目直下の検証文言、保存中の無効化、保存失敗の保持、破棄確認、場所の候補。
import { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { FieldErrors } from '../log/validation';
import { messages } from '../messages';
import { useCatchLog } from './CatchLogContext';
import { ConfirmDialog } from './ConfirmDialog';
import { ErrorBanner } from './ErrorBanner';
import { LabeledInput } from './LabeledInput';
import { PhotoPicker } from './PhotoPicker';
import { ScreenHeader } from './ScreenHeader';
import { SuggestionList } from './SuggestionList';
import { colors, MIN_TAP_SIZE, spacing } from './theme';

type Props = {
  readonly onSaved: () => void;
  readonly onCancel: () => void;
};

type Fields = {
  readonly species: string;
  readonly sizeCm: string;
  readonly weightG: string;
  readonly placeName: string;
};

const EMPTY_FIELDS: Fields = { species: '', sizeCm: '', weightG: '', placeName: '' };

export function CatchFormScreen({ onSaved, onCancel }: Props) {
  const log = useCatchLog();
  const [fields, setFields] = useState<Fields>(EMPTY_FIELDS);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDiscardDialogVisible, setDiscardDialogVisible] = useState(false);
  const [suggestions, setSuggestions] = useState<readonly string[]>([]);
  const [isPlaceFocused, setPlaceFocused] = useState(false);
  const suggestionRequest = useRef(0);

  const isDirty =
    photoUri !== null || Object.values(fields).some((value) => value.trim().length > 0);

  function clearFieldError(name: keyof FieldErrors) {
    setErrors((current) => {
      if (!(name in current)) {
        return current;
      }
      const next = { ...current };
      delete next[name];
      return next;
    });
    setSaveError(null);
  }

  function updateField(name: keyof Fields, value: string) {
    setFields((current) => ({ ...current, [name]: value }));
    clearFieldError(name);
  }

  function selectPhoto(uri: string) {
    setPhotoUri(uri);
    clearFieldError('photo');
  }

  // 場所の候補（BR6.1）: 入力中に問い合わせ、古い応答は捨てる
  const loadSuggestions = useCallback(
    async (query: string) => {
      suggestionRequest.current += 1;
      const requestId = suggestionRequest.current;
      const result = await log.suggestPlaces(query);
      if (requestId === suggestionRequest.current) {
        setSuggestions(result);
      }
    },
    [log],
  );

  function updatePlace(value: string) {
    updateField('placeName', value);
    void loadSuggestions(value);
  }

  function focusPlace() {
    setPlaceFocused(true);
    void loadSuggestions(fields.placeName);
  }

  function selectSuggestion(value: string) {
    updateField('placeName', value);
    setPlaceFocused(false);
    setSuggestions([]);
  }

  // 戻る（BR7.1）: 入力または写真があれば破棄の確認を出す
  const requestClose = useCallback(() => {
    if (isSaving) {
      return;
    }
    if (isDirty) {
      setDiscardDialogVisible(true);
      return;
    }
    onCancel();
  }, [isDirty, isSaving, onCancel]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      requestClose();
      return true;
    });
    return () => subscription.remove();
  }, [requestClose]);

  async function save() {
    if (isSaving) {
      return; // BR4.2
    }
    setIsSaving(true);
    setSaveError(null);
    const result = await log.saveCatch({ photoUri, ...fields });
    if (result.kind === 'saved') {
      onSaved();
      return;
    }
    setIsSaving(false);
    if (result.kind === 'invalid') {
      setErrors(result.errors);
      return;
    }
    setSaveError(result.reason); // BR4.1: 入力と写真は保持したまま
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title={messages.form.title}
        onBack={requestClose}
        backTestID="catch-form-back"
      />
      {saveError !== null ? (
        <ErrorBanner message={saveError} testID="catch-form-save-error" />
      ) : null}
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        testID="catch-form-main"
      >
        <PhotoPicker
          photoUri={photoUri}
          onPhotoSelected={selectPhoto}
          disabled={isSaving}
          error={errors.photo}
        />
        <LabeledInput
          label={messages.form.speciesLabel}
          value={fields.species}
          onChangeText={(text) => updateField('species', text)}
          error={errors.species}
          editable={!isSaving}
          testID="catch-form-species"
        />
        <LabeledInput
          label={messages.form.sizeLabel}
          value={fields.sizeCm}
          onChangeText={(text) => updateField('sizeCm', text)}
          error={errors.sizeCm}
          keyboardType="decimal-pad"
          editable={!isSaving}
          testID="catch-form-size"
        />
        <LabeledInput
          label={messages.form.weightLabel}
          value={fields.weightG}
          onChangeText={(text) => updateField('weightG', text)}
          error={errors.weightG}
          keyboardType="number-pad"
          editable={!isSaving}
          testID="catch-form-weight"
        />
        <LabeledInput
          label={messages.form.placeLabel}
          value={fields.placeName}
          onChangeText={updatePlace}
          error={errors.placeName}
          editable={!isSaving}
          onFocus={focusPlace}
          onBlur={() => setPlaceFocused(false)}
          testID="catch-form-place"
        />
        {isPlaceFocused ? (
          <SuggestionList suggestions={suggestions} onSelect={selectSuggestion} />
        ) : null}
        <Pressable
          onPress={save}
          disabled={isSaving}
          style={[styles.saveButton, isSaving ? styles.saveButtonDisabled : null]}
          accessibilityRole="button"
          accessibilityState={{ disabled: isSaving, busy: isSaving }}
          testID="catch-form-save"
        >
          <Text style={styles.saveButtonText}>
            {isSaving ? messages.form.saving : messages.form.save}
          </Text>
        </Pressable>
      </ScrollView>
      <ConfirmDialog
        visible={isDiscardDialogVisible}
        title={messages.form.discardTitle}
        confirmLabel={messages.form.discardConfirm}
        cancelLabel={messages.form.cancel}
        onConfirm={() => {
          setDiscardDialogVisible(false);
          onCancel();
        }}
        onCancel={() => setDiscardDialogVisible(false)}
        destructive
        testID="catch-form-discard-dialog"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  saveButton: {
    minHeight: MIN_TAP_SIZE + 4,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: colors.onPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
});
