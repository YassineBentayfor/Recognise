import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Page } from '../../components/Page';
import { PrimaryButton } from '../../components/PrimaryButton';
import { StickyFooter } from '../../components/StickyFooter';
import { TopBar } from '../../components/TopBar';
import { formatMoney, getTransaction } from '../../data/transactions';
import { useAppState } from '../../state/AppState';
import { colors, radii } from '../../theme';

type Stage = 'hub' | 'dispute' | 'card' | 'card_details' | 'card_settings' | 'freeze_confirm' | 'dispute_sent' | 'support' | 'support_sent';
type CardChoice = 'keep_active' | 'freeze_now';

export default function ResolutionScreen() {
  const { id, entry } = useLocalSearchParams<{ id: string; entry?: string }>();
  const transaction = getTransaction(id);
  const { cardFrozen, setCardFrozen, track } = useAppState();
  const initialStage: Stage = entry === 'dispute' ? 'dispute' : entry === 'support' ? 'support' : entry === 'card' ? 'card' : 'hub';
  const [stage, setStage] = useState<Stage>(initialStage);
  const [cardChoice, setCardChoice] = useState<CardChoice>('keep_active');
  const [cashWithdrawals, setCashWithdrawals] = useState(true);
  const [contactless, setContactless] = useState(true);
  const [onlinePayments, setOnlinePayments] = useState(true);

  if (!transaction) return <Page><TopBar back /><Text>Transaction not found.</Text></Page>;

  const openDispute = () => {
    track('dispute_started', transaction.id);
    setStage('dispute');
  };

  const sendDispute = () => {
    if (cardChoice === 'freeze_now' && !cardFrozen) setCardFrozen(true, transaction.id);
    setStage('dispute_sent');
  };

  if (stage === 'dispute') {
    return (
      <Page footer={<StickyFooter><PrimaryButton label="Continue dispute" onPress={sendDispute} /><TextButton label="Talk to support instead" onPress={() => setStage('support')} /></StickyFooter>}>
        <TopBar back title="Dispute payment" />
        <View style={styles.pageHeader}>
          <Text style={styles.title}>Report this card payment</Text>
          <Text style={styles.body}>We’ll send the payment details and your answers for review. You can choose what happens to the card separately.</Text>
        </View>

        <PaymentSummary merchant={transaction.merchant} amount={formatMoney(transaction.amount)} date={transaction.date} />

        <Text style={styles.sectionTitle}>What should happen to card ···· {transaction.cardLastFour}?</Text>
        <ChoiceRow
          selected={cardChoice === 'keep_active'}
          icon="card-outline"
          title="Keep the card active"
          detail="Use the card as normal while the payment is reviewed."
          onPress={() => setCardChoice('keep_active')}
        />
        <ChoiceRow
          selected={cardChoice === 'freeze_now'}
          icon="snow-outline"
          title="Freeze it after I continue"
          detail="New card payments and linked wallets will stop."
          onPress={() => setCardChoice('freeze_now')}
        />

        {cardChoice === 'keep_active' ? (
          <View style={styles.choiceNote}>
            <Ionicons name="information-circle-outline" size={19} color={colors.blue} />
            <Text style={styles.choiceNoteText}>The dispute can continue without freezing the card. If you notice another payment, you can freeze it later from Cards.</Text>
          </View>
        ) : (
          <View style={[styles.choiceNote, styles.choiceNoteWarning]}>
            <Ionicons name="alert-circle-outline" size={19} color={colors.coral} />
            <Text style={styles.choiceNoteText}>Subscriptions and phone-wallet payments using this card may fail until you unfreeze it.</Text>
          </View>
        )}
      </Page>
    );
  }

  if (stage === 'card') {
    return (
      <Page footer={
        <StickyFooter>
          {cardFrozen ? (
            <PrimaryButton label="Unfreeze card now" onPress={() => setCardFrozen(false, transaction.id)} />
          ) : (
            <PrimaryButton label="Review freeze impact" tone="danger" onPress={() => setStage('freeze_confirm')} />
          )}
          <TextButton label="Continue without changing the card" onPress={openDispute} />
        </StickyFooter>
      }>
        <TopBar back title="Card security" />
        <LinearGradient colors={['#078EDB', '#3E55D7', '#C839C1']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cardVisual}>
          <View style={styles.cardTop}><Text style={styles.cardBrand}>Standard</Text><Ionicons name={cardFrozen ? 'snow' : 'wifi'} size={20} color="#FFFFFF" /></View>
          <Text style={styles.cardNumber}>•••• {transaction.cardLastFour}</Text>
          <View style={styles.cardBottom}><Text style={styles.cardName}>YASSINE BENTAYFOR</Text><Text style={styles.cardState}>{cardFrozen ? 'FROZEN' : 'VISA'}</Text></View>
        </LinearGradient>

        <View style={styles.cardActions}>
          <CardAction icon="eye" label="Show details" onPress={() => setStage('card_details')} />
          <CardAction icon="snow" label={cardFrozen ? 'Frozen' : 'Freeze'} onPress={() => cardFrozen ? setCardFrozen(false, transaction.id) : setStage('freeze_confirm')} />
          <CardAction icon="settings" label="Settings" onPress={() => setStage('card_settings')} />
        </View>

        <Text style={styles.cardHeading}>{cardFrozen ? 'This card is frozen' : 'Payments tied to this card'}</Text>
        <Text style={styles.body}>{cardFrozen ? 'New card payments are blocked. Unfreeze it here whenever you need it.' : 'Review what may stop before you freeze it.'}</Text>

        <View style={styles.dependencies}>
          <Dependency icon="musical-notes" title="Music subscription" detail="Next payment 24 Oct · €47.82" />
          <Dependency icon="cloud-outline" title="Cloud storage" detail="Next payment 02 Oct · €2.99" />
          <Dependency icon="phone-portrait-outline" title="Phone wallet" detail="Card ···· 4821 is connected" />
          <Dependency icon="swap-horizontal" title="Bank transfers" detail="Not affected by card freezing" safe />
        </View>
      </Page>
    );
  }

  if (stage === 'card_details') {
    return (
      <Page footer={<StickyFooter><PrimaryButton label="Done" onPress={() => setStage('card')} /></StickyFooter>}>
        <TopBar back onBack={() => setStage('card')} title="Card details" />
        <View style={styles.detailsHeader}><View style={styles.detailsIcon}><Ionicons name="card" size={25} color={colors.blue} /></View><Text style={styles.title}>Standard virtual card</Text><Text style={styles.body}>Use these details for online payments. They belong to this prototype only.</Text></View>
        <View style={styles.cardDetailsPanel}>
          <StatusRow label="Card number" value="•••• •••• •••• 4821" />
          <StatusRow label="Expiry" value="10/29" />
          <StatusRow label="CVC" value="•••" />
          <StatusRow label="Cardholder" value="YASSINE BENTAYFOR" />
        </View>
      </Page>
    );
  }

  if (stage === 'card_settings') {
    return (
      <Page>
        <TopBar back onBack={() => setStage('card')} title="Settings" />
        <View style={styles.settingsPanel}>
          <SettingRow icon="globe-outline" title="Online payments" detail="Allow this card to be used online" value={onlinePayments} onChange={setOnlinePayments} />
          <SettingRow icon="cash-outline" title="Cash withdrawals" detail="Allow withdrawals from ATMs" value={cashWithdrawals} onChange={setCashWithdrawals} />
          <SettingRow icon="wifi-outline" title="Contactless payments" detail="Mobile wallets are not affected" value={contactless} onChange={setContactless} />
        </View>
        <View style={styles.settingsPanel}>
          <Pressable onPress={() => setStage('support')} style={({ pressed }) => [styles.settingsAction, pressed && styles.pressed]}><Ionicons name="refresh-outline" size={21} color={colors.blue} /><View style={styles.settingsActionCopy}><Text style={styles.settingsActionTitle}>Replace card</Text><Text style={styles.settingsActionText}>Lost, stolen or damaged</Text></View><Ionicons name="chevron-forward" size={18} color={colors.faint} /></Pressable>
          <Pressable onPress={() => setStage('support')} style={({ pressed }) => [styles.settingsAction, pressed && styles.pressed]}><Ionicons name="trash-outline" size={21} color={colors.coral} /><View style={styles.settingsActionCopy}><Text style={styles.settingsActionTitle}>Terminate card</Text></View><Ionicons name="chevron-forward" size={18} color={colors.faint} /></Pressable>
        </View>
      </Page>
    );
  }

  if (stage === 'freeze_confirm') {
    return (
      <Page footer={<StickyFooter><PrimaryButton label="Freeze card" tone="danger" onPress={() => { setCardFrozen(true, transaction.id); setStage('card'); }} /><TextButton label="I need to keep using this card" onPress={openDispute} /></StickyFooter>}>
        <TopBar back title="Freeze card" />
        <View style={styles.freezeHeader}>
          <View style={styles.freezeIcon}><Ionicons name="snow-outline" size={30} color={colors.coral} /></View>
          <Text style={styles.title}>New card payments will stop</Text>
          <Text style={styles.body}>This takes effect immediately for card ···· {transaction.cardLastFour}. It does not submit a dispute.</Text>
        </View>
        <View style={styles.impactList}>
          <Impact label="In-store and online card payments" value="Blocked" danger />
          <Impact label="Apple Pay and Google Pay" value="Blocked" danger />
          <Impact label="Subscriptions using this card" value="May fail" danger />
          <Impact label="Bank transfers and direct debits" value="Unaffected" />
        </View>
        <Pressable onPress={() => setStage('support')} style={styles.inlineSupport}>
          <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.blue} />
          <View style={styles.inlineSupportCopy}><Text style={styles.inlineSupportTitle}>Not sure what to do?</Text><Text style={styles.inlineSupportText}>Ask support without changing the card.</Text></View>
          <Ionicons name="chevron-forward" size={18} color={colors.faint} />
        </Pressable>
      </Page>
    );
  }

  if (stage === 'support') {
    return (
      <Page footer={<StickyFooter><PrimaryButton label="Send to support" onPress={() => { track('support_requested', transaction.id); setStage('support_sent'); }} /><TextButton label="Back to options" onPress={() => setStage('hub')} /></StickyFooter>}>
        <TopBar back title="Contact support" />
        <View style={styles.pageHeader}>
          <Text style={styles.title}>Share this payment with support</Text>
          <Text style={styles.body}>A support agent will receive the payment details and the checks already completed. Sending this does not freeze your card or open a dispute.</Text>
        </View>
        <PaymentSummary merchant={transaction.merchant} amount={formatMoney(transaction.amount)} date={transaction.date} />
        <View style={styles.sharedList}>
          <Text style={styles.sectionTitle}>Included with your message</Text>
          <SharedRow label="Payment details" />
          <SharedRow label="Merchant lookup result" />
          <SharedRow label="Related-payment history" />
          <SharedRow label="Your card’s current status" value={cardFrozen ? 'Frozen' : 'Active'} />
        </View>
      </Page>
    );
  }

  if (stage === 'dispute_sent' || stage === 'support_sent') {
    const dispute = stage === 'dispute_sent';
    return (
      <Page footer={<StickyFooter><PrimaryButton label="Back to transactions" onPress={() => router.dismissAll()} />{cardFrozen && <TextButton label="Unfreeze card" onPress={() => setCardFrozen(false, transaction.id)} />}</StickyFooter>}>
        <TopBar title={dispute ? 'Dispute submitted' : 'Message sent'} />
        <View style={styles.doneHeader}>
          <View style={styles.doneIcon}><Ionicons name="checkmark" size={31} color="#FFFFFF" /></View>
          <Text style={styles.title}>{dispute ? 'We’re reviewing the payment' : 'Support has the payment details'}</Text>
          <Text style={styles.body}>{dispute ? 'You’ll receive an update in the app. No additional information is needed right now.' : 'A support agent can continue from the checks already completed.'}</Text>
        </View>
        <View style={styles.statusPanel}>
          <StatusRow label="Payment" value={transaction.merchant} />
          <StatusRow label={dispute ? 'Dispute status' : 'Support status'} value={dispute ? 'Under review' : 'Message sent'} accent />
          <StatusRow label="Card ···· 4821" value={cardFrozen ? 'Frozen' : 'Active'} accent={!cardFrozen} />
        </View>
        {cardFrozen && (
          <View style={styles.frozenReminder}>
            <Ionicons name="snow-outline" size={20} color={colors.blue} />
            <Text style={styles.frozenReminderText}>The card remains frozen because you chose to freeze it. You can unfreeze it below.</Text>
          </View>
        )}
      </Page>
    );
  }

  return (
    <Page>
      <TopBar back title="Payment options" actionIcon="close" onAction={() => router.dismissAll()} />
      <View style={styles.pageHeader}>
        <Text style={styles.title}>What would you like to do?</Text>
        <Text style={styles.body}>Choose one path now. You can return and use another option later.</Text>
      </View>
      <PaymentSummary merchant={transaction.merchant} amount={formatMoney(transaction.amount)} date={transaction.date} />

      <ActionRow icon="document-text-outline" title="Dispute this payment" detail="Report it while keeping the card active, or freeze it during review." onPress={openDispute} />
      <ActionRow icon={cardFrozen ? 'snow' : 'shield-outline'} title={cardFrozen ? 'Manage frozen card' : 'Review card security'} detail={cardFrozen ? 'Unfreeze the card or review affected payments.' : 'See subscriptions and linked wallets before freezing.'} onPress={() => setStage('card')} />
      <ActionRow icon="chatbubble-ellipses-outline" title="Talk to support" detail="Send the payment and investigation details to an agent." onPress={() => setStage('support')} />

      <Text style={styles.noChange}>No account changes are made until you confirm them.</Text>
    </Page>
  );
}

function TextButton({ label, onPress }: { label: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.textButton, pressed && styles.pressed]}><Text style={styles.textButtonLabel}>{label}</Text></Pressable>;
}

function CardAction({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.cardAction, pressed && styles.pressed]}><View style={styles.cardActionCircle}><Ionicons name={icon} size={20} color={colors.ink} /></View><Text style={styles.cardActionLabel}>{label}</Text></Pressable>;
}

function SettingRow({ icon, title, detail, value, onChange }: { icon: keyof typeof Ionicons.glyphMap; title: string; detail: string; value: boolean; onChange: (value: boolean) => void }) {
  return <View style={styles.settingRow}><Ionicons name={icon} size={21} color={colors.blue} /><View style={styles.settingCopy}><Text style={styles.settingTitle}>{title}</Text><Text style={styles.settingDetail}>{detail}</Text></View><Switch accessibilityLabel={title} value={value} onValueChange={onChange} trackColor={{ false: '#55555D', true: colors.blue }} thumbColor="#FFFFFF" /></View>;
}

function PaymentSummary({ merchant, amount, date }: { merchant: string; amount: string; date: string }) {
  return <View style={styles.paymentSummary}><View style={styles.paymentIcon}><Ionicons name="receipt-outline" size={20} color={colors.ink} /></View><View style={styles.paymentSummaryCopy}><Text style={styles.paymentMerchant}>{merchant}</Text><Text style={styles.paymentDate}>{date}</Text></View><Text style={styles.paymentAmount}>{amount}</Text></View>;
}

function ChoiceRow({ selected, icon, title, detail, onPress }: { selected: boolean; icon: keyof typeof Ionicons.glyphMap; title: string; detail: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={[styles.choiceRow, selected && styles.choiceRowSelected]}><View style={styles.choiceIcon}><Ionicons name={icon} size={20} color={colors.ink} /></View><View style={styles.choiceCopy}><Text style={styles.choiceTitle}>{title}</Text><Text style={styles.choiceDetail}>{detail}</Text></View><View style={[styles.radio, selected && styles.radioSelected]}>{selected && <View style={styles.radioCore} />}</View></Pressable>;
}

function ActionRow({ icon, title, detail, onPress }: { icon: keyof typeof Ionicons.glyphMap; title: string; detail: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.actionRow, pressed && styles.pressed]}><View style={styles.actionIcon}><Ionicons name={icon} size={22} color={colors.blue} /></View><View style={styles.actionCopy}><Text style={styles.actionTitle}>{title}</Text><Text style={styles.actionDetail}>{detail}</Text></View><Ionicons name="chevron-forward" size={20} color={colors.faint} /></Pressable>;
}

function Dependency({ icon, title, detail, safe }: { icon: keyof typeof Ionicons.glyphMap; title: string; detail: string; safe?: boolean }) {
  return <View style={styles.dependency}><View style={[styles.dependencyIcon, safe && styles.dependencyIconSafe]}><Ionicons name={icon} size={19} color={safe ? colors.mint : colors.ink} /></View><View><Text style={styles.dependencyTitle}>{title}</Text><Text style={styles.dependencyDetail}>{detail}</Text></View></View>;
}

function Impact({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return <View style={styles.impactRow}><Text style={styles.impactLabel}>{label}</Text><Text style={[styles.impactValue, danger && styles.impactDanger]}>{value}</Text></View>;
}

function SharedRow({ label, value = 'Included' }: { label: string; value?: string }) {
  return <View style={styles.sharedRow}><Ionicons name="checkmark-circle" size={18} color={colors.mint} /><Text style={styles.sharedLabel}>{label}</Text><Text style={styles.sharedValue}>{value}</Text></View>;
}

function StatusRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return <View style={styles.statusRow}><Text style={styles.statusLabel}>{label}</Text><Text style={[styles.statusValue, accent && styles.statusAccent]}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  pageHeader: { paddingTop: 28, paddingBottom: 25 }, title: { color: colors.ink, fontSize: 29, lineHeight: 35, letterSpacing: -0.9, fontWeight: '800' }, body: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: 10, maxWidth: 420 },
  paymentSummary: { minHeight: 72, borderRadius: radii.md, backgroundColor: colors.mist, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 30 }, paymentIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#303036', alignItems: 'center', justifyContent: 'center' }, paymentSummaryCopy: { flex: 1 }, paymentMerchant: { color: colors.ink, fontSize: 14, fontWeight: '800' }, paymentDate: { color: colors.muted, fontSize: 11, marginTop: 4 }, paymentAmount: { color: colors.ink, fontSize: 16, fontWeight: '800', fontVariant: ['tabular-nums'] },
  sectionTitle: { color: colors.ink, fontSize: 17, lineHeight: 22, fontWeight: '800', marginBottom: 13 }, choiceRow: { minHeight: 78, flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: 1, borderTopColor: colors.line }, choiceRowSelected: { backgroundColor: colors.blueSoft, marginHorizontal: -12, paddingHorizontal: 12, borderTopColor: colors.blueSoft, borderRadius: radii.sm }, choiceIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.mist, alignItems: 'center', justifyContent: 'center' }, choiceCopy: { flex: 1 }, choiceTitle: { color: colors.ink, fontSize: 14, fontWeight: '800' }, choiceDetail: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 4 }, radio: { width: 21, height: 21, borderRadius: 11, borderWidth: 1.5, borderColor: colors.faint, alignItems: 'center', justifyContent: 'center' }, radioSelected: { borderColor: colors.blue }, radioCore: { width: 11, height: 11, borderRadius: 6, backgroundColor: colors.blue },
  choiceNote: { flexDirection: 'row', gap: 10, backgroundColor: colors.blueSoft, borderRadius: radii.sm, padding: 14, marginTop: 18 }, choiceNoteWarning: { backgroundColor: colors.coralSoft }, choiceNoteText: { flex: 1, color: colors.ink, fontSize: 12, lineHeight: 18 },
  actionRow: { minHeight: 94, flexDirection: 'row', alignItems: 'center', gap: 13, paddingHorizontal: 14, marginBottom: 2, backgroundColor: colors.mist, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line }, actionIcon: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.blueSoft, alignItems: 'center', justifyContent: 'center' }, actionCopy: { flex: 1 }, actionTitle: { color: colors.ink, fontSize: 15, fontWeight: '800' }, actionDetail: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 4 }, noChange: { color: colors.faint, fontSize: 11, textAlign: 'center', marginTop: 24 },
  cardVisual: { height: 198, borderRadius: 17, padding: 21, marginTop: 22, marginBottom: 20, justifyContent: 'space-between', overflow: 'hidden' }, cardTop: { flexDirection: 'row', justifyContent: 'space-between' }, cardBrand: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' }, cardNumber: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', letterSpacing: 1.4 }, cardBottom: { flexDirection: 'row', justifyContent: 'space-between' }, cardName: { color: '#E5E5EA', fontSize: 10, fontWeight: '700' }, cardState: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' }, cardActions: { flexDirection: 'row', justifyContent: 'center', gap: 38, marginBottom: 28 }, cardAction: { alignItems: 'center', minWidth: 66 }, cardActionCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#303036', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }, cardActionLabel: { color: colors.ink, fontSize: 11, fontWeight: '600' }, cardHeading: { color: colors.ink, fontSize: 24, fontWeight: '800', letterSpacing: -0.6 },
  dependencies: { marginTop: 24, borderRadius: radii.md, backgroundColor: colors.mist, paddingHorizontal: 14 }, dependency: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line }, dependencyIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#303036', alignItems: 'center', justifyContent: 'center' }, dependencyIconSafe: { backgroundColor: colors.mintSoft }, dependencyTitle: { color: colors.ink, fontSize: 13, fontWeight: '800' }, dependencyDetail: { color: colors.muted, fontSize: 11, marginTop: 4 },
  detailsHeader: { paddingTop: 35, paddingBottom: 28 }, detailsIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.blueSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 22 }, cardDetailsPanel: { borderRadius: radii.md, backgroundColor: colors.mist, paddingHorizontal: 14 },
  settingsPanel: { borderRadius: radii.md, backgroundColor: colors.mist, paddingHorizontal: 14, marginTop: 18 }, settingRow: { minHeight: 88, flexDirection: 'row', alignItems: 'center', gap: 13, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line }, settingCopy: { flex: 1 }, settingTitle: { color: colors.ink, fontSize: 14, fontWeight: '800' }, settingDetail: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 4 }, settingsAction: { minHeight: 74, flexDirection: 'row', alignItems: 'center', gap: 13, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line }, settingsActionCopy: { flex: 1 }, settingsActionTitle: { color: colors.ink, fontSize: 14, fontWeight: '800' }, settingsActionText: { color: colors.muted, fontSize: 12, marginTop: 4 },
  freezeHeader: { alignItems: 'center', paddingTop: 42, paddingBottom: 30 }, freezeIcon: { width: 68, height: 68, borderRadius: 34, backgroundColor: colors.coralSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 22 }, freezeHeaderTitle: { textAlign: 'center' }, impactList: { borderRadius: radii.md, backgroundColor: colors.mist, paddingHorizontal: 14 }, impactRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 20, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line }, impactLabel: { color: colors.ink, fontSize: 13, flex: 1 }, impactValue: { color: colors.mint, fontSize: 12, fontWeight: '800' }, impactDanger: { color: colors.coral },
  inlineSupport: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 22, paddingHorizontal: 14, backgroundColor: colors.blueSoft, borderRadius: radii.sm }, inlineSupportCopy: { flex: 1 }, inlineSupportTitle: { color: colors.ink, fontSize: 13, fontWeight: '800' }, inlineSupportText: { color: colors.muted, fontSize: 11, marginTop: 4 },
  sharedList: { borderRadius: radii.md, backgroundColor: colors.mist, paddingHorizontal: 14, paddingTop: 20 }, sharedRow: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line }, sharedLabel: { flex: 1, color: colors.ink, fontSize: 13 }, sharedValue: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  doneHeader: { alignItems: 'center', paddingTop: 56, paddingBottom: 34 }, doneIcon: { width: 68, height: 68, borderRadius: 34, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center', marginBottom: 24 }, statusPanel: { borderRadius: radii.md, backgroundColor: colors.mist, paddingHorizontal: 14 }, statusRow: { minHeight: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line }, statusLabel: { color: colors.muted, fontSize: 13 }, statusValue: { color: colors.ink, fontSize: 13, fontWeight: '800' }, statusAccent: { color: colors.mint },
  frozenReminder: { flexDirection: 'row', gap: 10, backgroundColor: colors.blueSoft, borderRadius: radii.sm, padding: 14, marginTop: 20 }, frozenReminderText: { flex: 1, color: colors.ink, fontSize: 12, lineHeight: 18 },
  textButton: { height: 42, alignItems: 'center', justifyContent: 'center' }, textButtonLabel: { color: colors.ink, fontSize: 14, fontWeight: '700' }, pressed: { opacity: 0.55 },
});
