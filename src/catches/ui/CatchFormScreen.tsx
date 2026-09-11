// S2 登録画面（WF-1）。スケルトン段階: 4項目の入力と保存、検証文言、保存中の無効化、保存失敗の表示。
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { FieldErrors } from '../log/validation';
import { messages } from '../messages';
import { useCatchLog } from './CatchLogContext';
import { ErrorBanner } from './ErrorBanner';
import { LabeledInput } from './LabeledInput';
import { ScreenHeader } from './ScreenHeader';
import { colors, MIN_TAP_SIZE, spacing } from './theme';

type Props = {
  readonly onSaved: () => void;
  readonly onCancel: () => void;
  /**
   * スケルトン限定: 写真の添付を実装するまでの間、あらかじめ用意した写真の参照を渡す。
   * Step 10（PhotoPicker 実装）で削除する。
   */
  readonly initialPhotoUri?: string | null;
};

type Fields = {
  readonly species: string;
  readonly sizeCm: string;
  readonly weightG: string;
  readonly placeName: string;
};

const EMPTY_FIELDS: Fields = { species: '', sizeCm: '', weightG: '', placeName: '' };

export function CatchFormScreen({ onSaved, onCancel, initialPhotoUri = null }: Props) {
  const log = useCatchLog();
  const [fields, setFields] = useState<Fields>(EMPTY_FIELDS);
  const [photoUri] = useState<string | null>(initialPhotoUri);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  function updateField(name: keyof Fields, value: string) {
    setFields((current) => ({ ...current, [name]: value }));
    // 項目を修正したらその項目の文言と保存失敗の文言を消す（S2 の状態遷移）
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
    setSaveError(result.reason); // BR4.1: 入力は保持したまま
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader title={messages.form.title} onBack={onCancel} backTestID="catch-form-back" />
      {saveError !== null ? (
        <ErrorBanner message={saveError} testID="catch-form-save-error" />
      ) : null}
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        testID="catch-form-main"
      >
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
          onChangeText={(text) => updateField('placeName', text)}
          error={errors.placeName}
          editable={!isSaving}
          testID="catch-form-place"
        />
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
