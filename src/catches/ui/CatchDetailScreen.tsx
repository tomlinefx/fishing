// S3 詳細画面（WF-3）: 原本の写真、項目（未入力は非表示、BR7.2）、確認付きの削除（BR3.1、BR3.2）。
import { useCallback, useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { Catch } from '../log/catch';
import {
  formatDetailDateTime,
  formatPhotoAltText,
  formatSizeCm,
  formatWeightG,
} from '../log/format';
import { messages } from '../messages';
import { useCatchLog } from './CatchLogContext';
import { ConfirmDialog } from './ConfirmDialog';
import { ErrorBanner } from './ErrorBanner';
import { LoadingSkeleton } from './LoadingSkeleton';
import { ScreenHeader } from './ScreenHeader';
import { colors, MIN_TAP_SIZE, spacing } from './theme';

type Props = {
  readonly id: string;
  readonly onBack: () => void;
  readonly onDeleted: () => void;
};

type LoadResult =
  | { readonly id: string; readonly status: 'loaded'; readonly catchRecord: Catch }
  | { readonly id: string; readonly status: 'failed'; readonly reason: string };

function DetailRow({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} selectable>
        {value}
      </Text>
    </View>
  );
}

export function CatchDetailScreen({ id, onBack, onDeleted }: Props) {
  const log = useCatchLog();
  const [result, setResult] = useState<LoadResult | null>(null);
  const [isConfirmVisible, setConfirmVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const loaded = await log.getCatch(id);
      if (cancelled) {
        return;
      }
      if (!loaded.ok) {
        setResult({ id, status: 'failed', reason: loaded.reason });
      } else if (loaded.value === null) {
        // 見つからない場合も「表示できませんでした」として戻る導線を出す
        setResult({ id, status: 'failed', reason: messages.detail.loadFailed });
      } else {
        setResult({ id, status: 'loaded', catchRecord: loaded.value });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [log, id]);

  const confirmDelete = useCallback(async () => {
    setConfirmVisible(false);
    if (isDeleting) {
      return;
    }
    setIsDeleting(true);
    setDeleteError(null);
    const deleted = await log.deleteCatch(id);
    if (deleted.ok) {
      onDeleted();
      return;
    }
    setIsDeleting(false);
    setDeleteError(deleted.reason);
  }, [id, isDeleting, log, onDeleted]);

  const current = result !== null && result.id === id ? result : null;
  const catchRecord = current?.status === 'loaded' ? current.catchRecord : null;
  const title = catchRecord?.species ?? messages.detail.untitled;

  return (
    <View style={styles.screen}>
      <ScreenHeader title={title} onBack={onBack} backTestID="catch-detail-back" />
      {current === null ? <LoadingSkeleton /> : null}
      {current?.status === 'failed' ? (
        <ErrorBanner
          message={current.reason}
          actionLabel={messages.detail.back}
          onAction={onBack}
          testID="catch-detail-load-error"
        />
      ) : null}
      {deleteError !== null ? (
        <ErrorBanner message={deleteError} testID="catch-detail-delete-error" />
      ) : null}
      {catchRecord !== null ? (
        <ScrollView contentContainerStyle={styles.content} testID="catch-detail-main">
          <Image
            source={{ uri: catchRecord.photoPath }}
            style={styles.photo}
            resizeMode="contain"
            accessibilityLabel={formatPhotoAltText(catchRecord)}
            accessible
            testID="catch-detail-photo"
          />
          {catchRecord.species !== null ? (
            <DetailRow label={messages.detail.speciesLabel} value={catchRecord.species} />
          ) : null}
          {catchRecord.sizeCm !== null ? (
            <DetailRow label={messages.detail.sizeLabel} value={formatSizeCm(catchRecord.sizeCm)} />
          ) : null}
          {catchRecord.weightG !== null ? (
            <DetailRow
              label={messages.detail.weightLabel}
              value={formatWeightG(catchRecord.weightG)}
            />
          ) : null}
          {catchRecord.placeName !== null ? (
            <DetailRow label={messages.detail.placeLabel} value={catchRecord.placeName} />
          ) : null}
          <DetailRow
            label={messages.detail.dateLabel}
            value={formatDetailDateTime(catchRecord.caughtAt)}
          />
          <Pressable
            onPress={() => setConfirmVisible(true)}
            disabled={isDeleting}
            style={[styles.deleteButton, isDeleting ? styles.deleteButtonDisabled : null]}
            accessibilityRole="button"
            accessibilityState={{ disabled: isDeleting, busy: isDeleting }}
            testID="catch-detail-delete"
          >
            <Text style={styles.deleteButtonText}>{messages.detail.deleteButton}</Text>
          </Pressable>
        </ScrollView>
      ) : null}
      <ConfirmDialog
        visible={isConfirmVisible}
        title={messages.detail.deleteConfirmTitle}
        confirmLabel={messages.detail.deleteConfirm}
        cancelLabel={messages.detail.cancel}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setConfirmVisible(false)}
        destructive
        testID="catch-detail-delete-dialog"
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
  photo: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 12,
    backgroundColor: colors.skeleton,
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowLabel: {
    width: 72,
    fontSize: 14,
    color: colors.textMuted,
  },
  rowValue: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  deleteButton: {
    marginTop: spacing.xl,
    minHeight: MIN_TAP_SIZE + 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonDisabled: {
    opacity: 0.6,
  },
  deleteButtonText: {
    color: colors.danger,
    fontSize: 16,
    fontWeight: '600',
  },
});
