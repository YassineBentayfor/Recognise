import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Page } from '../../components/Page';
import { PrimaryButton } from '../../components/PrimaryButton';
import { StickyFooter } from '../../components/StickyFooter';
import { TopBar } from '../../components/TopBar';
import { formatMoney, getTransaction } from '../../data/transactions';
import { investigateTransaction } from '../../lib/investigation';
import { useAppState } from '../../state/AppState';
import { colors, radii } from '../../theme';

type Phase = 'checking' | 'result';

export default function InvestigationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const transaction = getTransaction(id);
  const { recognize, track } = useAppState();
  const [phase, setPhase] = useState<Phase>('checking');
  const [completedSteps, setCompletedSteps] = useState(0);
  const [context, setContext] = useState<string | null>(null);
  const [reveal] = useState(() => new Animated.Value(0));

  const investigation = useMemo(() => transaction ? investigateTransaction(transaction) : null, [transaction]);
  const allChecksDone = investigation ? completedSteps >= investigation.tools.length : false;

  useEffect(() => {
    if (!investigation) return;
    track('investigation_started', id);
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];

    AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      investigation.tools.forEach((_, index) => {
        const delay = reduceMotion ? 0 : 520 + index * 620;
        timers.push(setTimeout(() => {
          if (cancelled) return;
          setCompletedSteps(index + 1);
          if (index === investigation.tools.length - 1) track('investigation_completed', id);
        }, delay));
      });
    });

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [id, investigation, track]);

  useEffect(() => {
    if (phase !== 'result') return;
    AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (reduceMotion) {
        reveal.setValue(1);
        return;
      }
      Animated.spring(reveal, { toValue: 1, damping: 18, stiffness: 170, mass: 0.8, useNativeDriver: true }).start();
    });
  }, [phase, reveal]);

  if (!transaction || !investigation) return <Page><TopBar back /><Text>Transaction not found.</Text></Page>;

  const openResolution = (entry: 'dispute' | 'options' | 'support' | 'card') => {
    router.push({ pathname: '/resolution/[id]', params: { id: transaction.id, entry } });
  };

  const markRecognized = () => {
    recognize(transaction.id);
    router.dismissAll();
  };

  if (phase === 'checking') {
    const progress = Math.round((completedSteps / investigation.tools.length) * 100);
    return (
      <Page footer={allChecksDone ? <StickyFooter><PrimaryButton label="Review result" onPress={() => { track('evidence_viewed', id); setPhase('result'); }} /></StickyFooter> : undefined}>
        <TopBar back title="Card payment" />
        <View style={styles.checkHeader}>
          <View style={styles.paymentLine}>
            <View style={styles.miniReceipt}><Ionicons name="receipt-outline" size={20} color={colors.ink} /></View>
            <View style={styles.paymentCopy}>
              <Text numberOfLines={1} style={styles.paymentMerchant}>{transaction.merchant}</Text>
              <Text style={styles.paymentMeta}>{transaction.date}</Text>
            </View>
            <Text style={styles.paymentAmount}>{formatMoney(transaction.amount)}</Text>
          </View>
          <Text style={styles.checkTitle}>{allChecksDone ? 'Check complete' : `Checking ${transaction.merchant}`}</Text>
          <Text style={styles.checkBody}>
            {allChecksDone
              ? 'Nothing has been changed on your account. Review what we found before choosing what to do.'
              : 'We’re comparing this payment with merchant data, your account history and card-payment rules.'}
          </Text>
          <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${progress}%` }]} /></View>
          <Text style={styles.progressText}>{completedSteps} of {investigation.tools.length} checks complete</Text>
        </View>

        <View style={styles.checks}>
          {investigation.tools.map((tool, index) => {
            const done = index < completedSteps;
            const active = index === completedSteps && !allChecksDone;
            return (
              <View key={tool.name} style={styles.checkRow}>
                <View style={[styles.checkState, done && styles.checkStateDone, active && styles.checkStateActive]}>
                  {done ? <Ionicons name="checkmark" size={14} color="#FFFFFF" /> : <View style={[styles.waitingDot, active && styles.activeDot]} />}
                </View>
                <View style={styles.checkCopy}>
                  <Text style={[styles.checkLabel, !done && !active && styles.checkLabelWaiting]}>{tool.label}</Text>
                  {done && <Text style={styles.checkResult}>{tool.result}</Text>}
                  {active && <Text style={styles.checkResult}>Checking now…</Text>}
                </View>
              </View>
            );
          })}
        </View>
      </Page>
    );
  }

  const uncertain = investigation.outcome === 'insufficient_evidence';
  const duplicate = investigation.outcome === 'reverted_duplicate';

  return (
    <Page footer={
      <StickyFooter>
        {uncertain ? (
          <>
            <PrimaryButton label="Dispute this payment" onPress={() => { track('dispute_started', id); openResolution('dispute'); }} />
            <Pressable onPress={() => openResolution('options')} style={({ pressed }) => [styles.footerLink, pressed && styles.pressed]}>
              <Text style={styles.footerLinkText}>See card and support options</Text>
            </Pressable>
          </>
        ) : (
          <>
            <PrimaryButton label={duplicate ? 'Got it' : 'This is my payment'} onPress={markRecognized} />
            <Pressable onPress={() => openResolution('options')} style={({ pressed }) => [styles.footerLink, pressed && styles.pressed]}>
              <Text style={styles.footerLinkText}>I still need help</Text>
            </Pressable>
          </>
        )}
      </StickyFooter>
    }>
      <TopBar back title="Card payment" actionIcon="close" onAction={() => router.dismissAll()} />
      <Animated.View style={{ opacity: reveal, transform: [{ translateY: reveal.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }] }}>
        <View style={[styles.resultBand, uncertain ? styles.resultBandUnknown : styles.resultBandKnown]}>
          <View style={[styles.resultIcon, uncertain ? styles.resultIconUnknown : styles.resultIconKnown]}>
            <Ionicons name={uncertain ? 'help' : duplicate ? 'arrow-undo' : 'repeat'} size={24} color={uncertain ? colors.amber : colors.mint} />
          </View>
          <Text style={styles.resultLabel}>{investigation.eyebrow}</Text>
          <Text style={styles.resultTitle}>{investigation.title}</Text>
          <Text style={styles.resultBody}>{investigation.explanation}</Text>
        </View>

        <View style={styles.transactionBar}>
          <View style={styles.paymentCopy}>
            <Text style={styles.transactionName}>{transaction.merchant}</Text>
            <Text style={styles.paymentMeta}>{transaction.date} · {transaction.status}</Text>
          </View>
          <Text style={styles.transactionAmount}>{formatMoney(transaction.amount)}</Text>
        </View>

        <Text style={styles.sectionTitle}>{uncertain ? 'What we checked' : 'Why this matches'}</Text>
        <View style={styles.factList}>
          {investigation.evidence.map((item, index) => (
            <View key={item.label} style={[styles.factRow, index > 0 && styles.factBorder]}>
              <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={19} color={uncertain ? colors.amber : colors.blue} />
              <Text style={styles.factLabel}>{item.label}</Text>
              <Text style={styles.factValue}>{item.value}</Text>
            </View>
          ))}
        </View>

        {transaction.history.length > 0 && (
          <View style={styles.timelineSection}>
            <Text style={styles.sectionTitle}>Earlier payments</Text>
            <View style={styles.timeline}>
              {[...transaction.history, { id: transaction.id, date: '24 Sep', amount: transaction.amount, status: transaction.status }].map((item, index, all) => (
                <View key={item.id} style={styles.timelineRow}>
                  <View style={styles.rail}>
                    <View style={[styles.node, index === all.length - 1 && styles.nodeCurrent]} />
                    {index < all.length - 1 && <View style={styles.line} />}
                  </View>
                  <Text style={styles.timelineDate}>{item.date}</Text>
                  <Text style={styles.timelineAmount}>€{item.amount.toFixed(2)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {uncertain && (
          <>
            <View style={styles.optionalFreeze}>
              <Ionicons name="information-circle-outline" size={20} color={colors.blue} />
              <Text style={styles.optionalFreezeText}>You can dispute this payment without freezing the card. Card security is a separate choice.</Text>
            </View>
            <View style={styles.contextSection}>
              <Text style={styles.sectionTitle}>Does any of this sound familiar?</Text>
              <Text style={styles.contextIntro}>This can help avoid a dispute you don’t need. It won’t block the dispute option.</Text>
              {[
                ['amount', 'I recognise the amount, not the business name'],
                ['household', 'Someone I know may have used this card'],
                ['nothing', 'No, I don’t recognise any of it'],
              ].map(([value, label]) => (
                <Pressable key={value} onPress={() => setContext(value)} style={[styles.contextRow, context === value && styles.contextRowSelected]}>
                  <View style={[styles.radio, context === value && styles.radioSelected]}>{context === value && <View style={styles.radioCore} />}</View>
                  <Text style={styles.contextLabel}>{label}</Text>
                </Pressable>
              ))}
              {context && context !== 'nothing' && <Text style={styles.contextHint}>Check with the card user or search receipts first. You can still dispute below.</Text>}
            </View>
          </>
        )}

      </Animated.View>
    </Page>
  );
}

const styles = StyleSheet.create({
  checkHeader: { paddingTop: 18, paddingBottom: 28 },
  paymentLine: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 38 },
  miniReceipt: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.mist, alignItems: 'center', justifyContent: 'center' },
  paymentCopy: { flex: 1, minWidth: 0 }, paymentMerchant: { color: colors.ink, fontSize: 14, fontWeight: '800' }, paymentMeta: { color: colors.muted, fontSize: 12, marginTop: 4 },
  paymentAmount: { color: colors.ink, fontSize: 15, fontWeight: '800', fontVariant: ['tabular-nums'] },
  checkTitle: { color: colors.ink, fontSize: 29, lineHeight: 35, letterSpacing: -0.9, fontWeight: '800' },
  checkBody: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: 10, maxWidth: 420 },
  progressTrack: { height: 5, borderRadius: 3, backgroundColor: colors.line, overflow: 'hidden', marginTop: 24 }, progressFill: { height: 5, borderRadius: 3, backgroundColor: colors.blue },
  progressText: { color: colors.muted, fontSize: 11, marginTop: 8, fontVariant: ['tabular-nums'] }, checks: { backgroundColor: colors.mist, borderRadius: radii.md, paddingHorizontal: 14 },
  checkRow: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 13, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  checkState: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.mist, alignItems: 'center', justifyContent: 'center' }, checkStateDone: { backgroundColor: colors.mint }, checkStateActive: { borderWidth: 2, borderColor: colors.blue, backgroundColor: colors.paper },
  waitingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.faint }, activeDot: { backgroundColor: colors.blue }, checkCopy: { flex: 1 },
  checkLabel: { color: colors.ink, fontSize: 14, fontWeight: '700' }, checkLabelWaiting: { color: colors.faint }, checkResult: { color: colors.muted, fontSize: 12, marginTop: 4 },
  resultBand: { marginHorizontal: -20, paddingHorizontal: 20, paddingTop: 30, paddingBottom: 32, borderBottomWidth: 1, borderBottomColor: colors.line }, resultBandKnown: { backgroundColor: colors.mintSoft }, resultBandUnknown: { backgroundColor: colors.amberSoft },
  resultIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }, resultIconKnown: { backgroundColor: '#1D3A32' }, resultIconUnknown: { backgroundColor: '#4A3918' },
  resultLabel: { color: colors.muted, fontSize: 13, fontWeight: '700', marginBottom: 8 }, resultTitle: { color: colors.ink, fontSize: 30, lineHeight: 35, letterSpacing: -1, fontWeight: '800', maxWidth: 430 }, resultBody: { color: colors.muted, fontSize: 15, lineHeight: 23, marginTop: 12, maxWidth: 430 },
  transactionBar: { minHeight: 72, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.line, marginBottom: 28 }, transactionName: { color: colors.ink, fontSize: 14, fontWeight: '800' }, transactionAmount: { color: colors.ink, fontSize: 17, fontWeight: '800', fontVariant: ['tabular-nums'] },
  sectionTitle: { color: colors.ink, fontSize: 18, fontWeight: '800', marginBottom: 12 }, factList: { backgroundColor: colors.mist, borderRadius: radii.md, paddingHorizontal: 14 }, factRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 11 }, factBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  factLabel: { flex: 1, color: colors.muted, fontSize: 13 }, factValue: { color: colors.ink, fontSize: 13, fontWeight: '700', textAlign: 'right', maxWidth: '45%' },
  timelineSection: { marginTop: 30 }, timeline: { backgroundColor: colors.mist, borderRadius: radii.md, padding: 17 }, timelineRow: { height: 38, flexDirection: 'row', alignItems: 'flex-start' }, rail: { width: 24, height: 38, alignItems: 'center' },
  node: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.faint, zIndex: 1, marginTop: 2 }, nodeCurrent: { backgroundColor: colors.blue, width: 11, height: 11 }, line: { width: 1, backgroundColor: colors.line, flex: 1 }, timelineDate: { color: colors.muted, fontSize: 13, flex: 1 }, timelineAmount: { color: colors.ink, fontSize: 13, fontWeight: '700' },
  optionalFreeze: { flexDirection: 'row', gap: 10, backgroundColor: colors.blueSoft, borderRadius: radii.sm, padding: 14, marginTop: 28 }, optionalFreezeText: { flex: 1, color: colors.ink, fontSize: 12, lineHeight: 18 },
  contextSection: { marginTop: 28 }, contextIntro: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: -4, marginBottom: 13 }, contextRow: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: 1, borderTopColor: colors.line }, contextRowSelected: { backgroundColor: colors.blueSoft, marginHorizontal: -10, paddingHorizontal: 10, borderTopColor: colors.blueSoft },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: colors.faint, alignItems: 'center', justifyContent: 'center' }, radioSelected: { borderColor: colors.blue }, radioCore: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.blue }, contextLabel: { flex: 1, color: colors.ink, fontSize: 13, lineHeight: 18 }, contextHint: { color: colors.muted, fontSize: 12, lineHeight: 18, paddingTop: 12 },
  footerLink: { height: 42, alignItems: 'center', justifyContent: 'center' }, footerLinkText: { color: colors.ink, fontSize: 14, fontWeight: '700' }, pressed: { opacity: 0.55 },
});
