import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { MerchantIcon } from '../../components/MerchantIcon';
import { Page } from '../../components/Page';
import { TopBar } from '../../components/TopBar';
import { formatMoney, getTransaction } from '../../data/transactions';
import { useAppState } from '../../state/AppState';
import { colors, radii } from '../../theme';

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const transaction = getTransaction(id);
  const { cardFrozen, recognizedIds } = useAppState();
  const [sheet, setSheet] = useState<'split' | 'download' | null>(null);

  if (!transaction) return <Page><TopBar back /><Text>Transaction not found.</Text></Page>;
  const recognized = recognizedIds.includes(transaction.id);

  return (
    <Page>
      <TopBar back title="Card payment" actionIcon="ellipsis-horizontal" onAction={() => setSheet('download')} />
      <View style={styles.hero}>
        <MerchantIcon icon={transaction.icon} tone={transaction.iconTone} size={64} />
        <Text style={styles.amount}>{formatMoney(transaction.amount)}</Text>
        <Text style={styles.merchant}>{transaction.merchant}</Text>
        <Text style={styles.date}>{transaction.date}, {transaction.time}</Text>
        <View style={styles.status}><Ionicons name={recognized ? 'checkmark-circle' : 'checkmark'} size={14} color={recognized ? colors.mint : colors.muted} /><Text style={[styles.statusText, recognized && styles.recognizedText]}>{recognized ? 'Recognised' : transaction.status}</Text></View>
      </View>

      <View style={styles.quickActions}>
        <DetailAction icon="help-circle-outline" label="Get help" onPress={() => router.push({ pathname: '/investigate/[id]', params: { id: transaction.id } })} />
        <DetailAction icon="people-outline" label="Split bill" onPress={() => setSheet('split')} />
        <DetailAction icon="download-outline" label="Download" onPress={() => setSheet('download')} />
      </View>

      <View style={styles.detailsSection}>
        <DetailRow label="Status" value={transaction.status} />
        <DetailRow label="Card" value={`Virtual ···· ${transaction.cardLastFour}`} />
        <DetailRow label="Category" value={transaction.category} />
        <DetailRow label="Statement name" value={transaction.descriptor} />
        {transaction.location && <DetailRow label="Location" value={transaction.location} />}
      </View>

      {cardFrozen && (
        <Pressable onPress={() => router.push({ pathname: '/resolution/[id]', params: { id: transaction.id, entry: 'card' } })} style={({ pressed }) => [styles.cardStatus, pressed && styles.pressed]}>
          <View style={styles.cardStatusIcon}><Ionicons name="snow" size={18} color={colors.blue} /></View>
          <View style={styles.cardStatusCopy}><Text style={styles.cardStatusTitle}>Card ···· {transaction.cardLastFour} is frozen</Text><Text style={styles.cardStatusText}>Tap to manage or unfreeze it</Text></View>
          <Ionicons name="chevron-forward" size={18} color={colors.faint} />
        </Pressable>
      )}

      <View style={styles.helpSection}>
        <Text style={styles.helpTitle}>Help with this payment</Text>
        <HelpRow title="I don’t recognise this card payment" onPress={() => router.push({ pathname: '/investigate/[id]', params: { id: transaction.id } })} />
        <HelpRow title="I was charged more than once" onPress={() => router.push({ pathname: '/investigate/[id]', params: { id: 'tx-duplicate' } })} />
        <HelpRow title="I want to dispute this payment" onPress={() => router.push({ pathname: '/resolution/[id]', params: { id: transaction.id, entry: 'dispute' } })} />
        <HelpRow title="Chat with support" onPress={() => router.push({ pathname: '/resolution/[id]', params: { id: transaction.id, entry: 'support' } })} />
      </View>

      <Text style={styles.demoLabel}>Prototype · synthetic payment data</Text>
      <InfoSheet type={sheet} merchant={transaction.merchant} onClose={() => setSheet(null)} />
    </Page>
  );
}

function DetailAction({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.actionItem, pressed && styles.pressed]}><View style={styles.actionCircle}><Ionicons name={icon} size={21} color={colors.ink} /></View><Text style={styles.actionLabel}>{label}</Text></Pressable>;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return <View style={styles.detailRow}><Text style={styles.detailLabel}>{label}</Text><Text style={styles.detailValue}>{value}</Text></View>;
}

function HelpRow({ title, onPress }: { title: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.helpRow, pressed && styles.pressed]}><Text style={styles.helpRowText}>{title}</Text><Ionicons name="chevron-forward" size={19} color={colors.faint} /></Pressable>;
}

function InfoSheet({ type, merchant, onClose }: { type: 'split' | 'download' | null; merchant: string; onClose: () => void }) {
  const split = type === 'split';
  return (
    <Modal visible={type !== null} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.sheetBackdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => undefined}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetIcon}><Ionicons name={split ? 'people-outline' : 'document-text-outline'} size={25} color={colors.blue} /></View>
          <Text style={styles.sheetTitle}>{split ? 'Split this bill' : 'Payment statement ready'}</Text>
          <Text style={styles.sheetText}>{split ? `Choose friends to split the ${merchant} payment with. No request is sent until you confirm.` : `A statement for the ${merchant} payment is ready to save.`}</Text>
          {split && <View style={styles.people}><Person initials="YA" name="Yasmine" /><Person initials="AL" name="Alex" /><Person initials="MR" name="Marie" /></View>}
          <Pressable onPress={onClose} style={styles.sheetButton}><Text style={styles.sheetButtonText}>{split ? 'Continue' : 'Save statement'}</Text></Pressable>
          <Pressable onPress={onClose} style={styles.sheetCancel}><Text style={styles.sheetCancelText}>Cancel</Text></Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Person({ initials, name }: { initials: string; name: string }) {
  return <Pressable style={styles.person}><View style={styles.personAvatar}><Text style={styles.personInitials}>{initials}</Text></View><Text style={styles.personName}>{name}</Text></Pressable>;
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', paddingTop: 22, paddingBottom: 24 }, amount: { fontSize: 36, fontWeight: '800', letterSpacing: -1.2, color: colors.ink, marginTop: 17, fontVariant: ['tabular-nums'] }, merchant: { fontSize: 16, color: colors.ink, fontWeight: '700', marginTop: 5 }, date: { fontSize: 12, color: colors.muted, marginTop: 5 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 10 }, statusText: { color: colors.muted, fontSize: 12, fontWeight: '700' }, recognizedText: { color: colors.mint },
  quickActions: { flexDirection: 'row', justifyContent: 'center', gap: 30, paddingBottom: 28 }, actionItem: { alignItems: 'center', width: 66 }, actionCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#303036', alignItems: 'center', justifyContent: 'center', marginBottom: 7 }, actionLabel: { color: colors.ink, fontSize: 11, fontWeight: '700' },
  detailsSection: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 17, backgroundColor: colors.mist }, detailRow: { minHeight: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 20, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line }, detailLabel: { color: colors.muted, fontSize: 13 }, detailValue: { color: colors.ink, fontSize: 13, fontWeight: '700', maxWidth: '60%', textAlign: 'right' },
  cardStatus: { minHeight: 66, flexDirection: 'row', alignItems: 'center', gap: 11, marginTop: 20, paddingHorizontal: 13, borderRadius: radii.md, backgroundColor: colors.blueSoft }, cardStatusIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center' }, cardStatusCopy: { flex: 1 }, cardStatusTitle: { color: colors.ink, fontSize: 13, fontWeight: '800' }, cardStatusText: { color: colors.muted, fontSize: 11, marginTop: 4 },
  helpSection: { paddingTop: 28 }, helpTitle: { color: colors.ink, fontSize: 18, fontWeight: '800', marginBottom: 12 }, helpRow: { minHeight: 58, paddingHorizontal: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line, backgroundColor: colors.mist, flexDirection: 'row', alignItems: 'center' }, helpRowText: { flex: 1, color: colors.ink, fontSize: 14, fontWeight: '600' }, demoLabel: { color: colors.faint, fontSize: 10, textAlign: 'center', marginTop: 25 }, pressed: { opacity: 0.55 },
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.68)', justifyContent: 'flex-end' }, sheet: { backgroundColor: colors.mist, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 22 }, sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#5A5A60', alignSelf: 'center', marginBottom: 22 }, sheetIcon: { width: 50, height: 50, borderRadius: 17, backgroundColor: colors.blueSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 18 }, sheetTitle: { color: colors.ink, fontSize: 25, fontWeight: '800', letterSpacing: -0.6 }, sheetText: { color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: 8 }, people: { flexDirection: 'row', gap: 18, marginTop: 22 }, person: { alignItems: 'center' }, personAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#303036', alignItems: 'center', justifyContent: 'center' }, personInitials: { color: colors.ink, fontSize: 12, fontWeight: '800' }, personName: { color: colors.muted, fontSize: 10, marginTop: 6 }, sheetButton: { height: 54, borderRadius: 27, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center', marginTop: 24 }, sheetButtonText: { color: colors.paper, fontSize: 15, fontWeight: '800' }, sheetCancel: { height: 44, alignItems: 'center', justifyContent: 'center' }, sheetCancelText: { color: colors.ink, fontSize: 14, fontWeight: '700' },
});
