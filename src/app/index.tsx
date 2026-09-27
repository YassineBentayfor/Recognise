import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MerchantIcon } from '../components/MerchantIcon';
import { formatMoney, transactions } from '../data/transactions';
import { useAppState } from '../state/AppState';
import { colors, radii } from '../theme';

type TabName = 'Home' | 'Invest' | 'Payments' | 'Crypto' | 'RevPoints';
type SheetName = 'profile' | 'add' | 'transfer' | 'more' | 'accounts' | null;

const tabs: { name: TabName; icon: keyof typeof Ionicons.glyphMap; activeIcon: keyof typeof Ionicons.glyphMap }[] = [
  { name: 'Home', icon: 'home-outline', activeIcon: 'home' },
  { name: 'Invest', icon: 'stats-chart-outline', activeIcon: 'stats-chart' },
  { name: 'Payments', icon: 'swap-horizontal-outline', activeIcon: 'swap-horizontal' },
  { name: 'Crypto', icon: 'logo-bitcoin', activeIcon: 'logo-bitcoin' },
  { name: 'RevPoints', icon: 'diamond-outline', activeIcon: 'diamond' },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { cardFrozen } = useAppState();
  const [activeTab, setActiveTab] = useState<TabName>('Home');
  const [sheet, setSheet] = useState<SheetName>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.shell}>
        {activeTab === 'Home' ? (
          <HomeTab cardFrozen={cardFrozen} openSearch={() => setSearchOpen(true)} openSheet={setSheet} />
        ) : (
          <ProductTab tab={activeTab} openSheet={setSheet} />
        )}
        <BottomNav active={activeTab} onChange={setActiveTab} bottomInset={insets.bottom} />
      </View>
      <ActionSheet name={sheet} onClose={() => setSheet(null)} />
      <SearchScreen visible={searchOpen} query={query} setQuery={setQuery} onClose={() => { setSearchOpen(false); setQuery(''); }} />
    </SafeAreaView>
  );
}

function HomeTab({ cardFrozen, openSearch, openSheet }: { cardFrozen: boolean; openSearch: () => void; openSheet: (name: SheetName) => void }) {
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.homeContent} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={['#D24A18', '#82345F', '#242542', '#070708']} locations={[0, 0.3, 0.68, 1]} start={{ x: 0, y: 0 }} end={{ x: 0.85, y: 1 }} style={styles.accountBackdrop}>
        <View style={styles.topbar}>
          <Pressable accessibilityLabel="Open profile" onPress={() => openSheet('profile')} style={({ pressed }) => [styles.avatar, pressed && styles.pressed]}><Text style={styles.avatarText}>YB</Text></Pressable>
          <Pressable accessibilityLabel="Search" onPress={openSearch} style={({ pressed }) => [styles.searchPill, pressed && styles.pressed]}><Ionicons name="search" size={19} color={colors.ink} /><Text style={styles.searchLabel}>Search</Text></Pressable>
          <Pressable accessibilityLabel="Open analytics" onPress={() => openSheet('more')} style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}><Ionicons name="stats-chart" size={20} color={colors.ink} /></Pressable>
          <Pressable accessibilityLabel="Open cards" onPress={() => router.push({ pathname: '/resolution/[id]', params: { id: 'tx-hotel', entry: 'card' } })} style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}><Ionicons name="card" size={20} color={colors.ink} /></Pressable>
        </View>
        <Pressable onPress={() => openSheet('accounts')} style={({ pressed }) => [styles.accountSelector, pressed && styles.pressed]}><Text style={styles.accountSelectorText}>Personal · EUR</Text><Ionicons name="chevron-down" size={14} color={colors.ink} /></Pressable>
        <Text style={styles.balance}>€4,821.72</Text>
        <Text style={styles.balanceChange}>+€164.08 this month</Text>
        <View style={styles.quickActions}>
          <QuickAction icon="add" label="Add money" onPress={() => openSheet('add')} />
          <QuickAction icon="shuffle" label="Move" onPress={() => openSheet('transfer')} />
          <QuickAction icon="business" label="Details" onPress={() => openSheet('accounts')} />
          <QuickAction icon="ellipsis-horizontal" label="More" onPress={() => openSheet('more')} />
        </View>
      </LinearGradient>

      <View style={styles.activitySheet}>
        {cardFrozen && <Pressable onPress={() => router.push({ pathname: '/resolution/[id]', params: { id: 'tx-hotel', entry: 'card' } })} style={({ pressed }) => [styles.frozenBanner, pressed && styles.pressed]}><View style={styles.frozenIcon}><Ionicons name="snow" size={18} color={colors.blue} /></View><View style={styles.bannerCopy}><Text style={styles.bannerTitle}>Card ···· 4821 is frozen</Text><Text style={styles.bannerText}>Tap to manage or unfreeze it</Text></View><Ionicons name="chevron-forward" size={18} color={colors.faint} /></Pressable>}
        <View style={styles.transactionPanel}>
          <TransactionList items={transactions.slice(0, 4)} />
          <Pressable onPress={openSearch} style={({ pressed }) => [styles.seeAll, pressed && styles.pressed]}><Text style={styles.seeAllText}>See all</Text></Pressable>
        </View>
        <Pressable onPress={() => openSheet('more')} style={({ pressed }) => [styles.productsPanel, pressed && styles.pressed]}><Text style={styles.productsTitle}>Products for you</Text><Ionicons name="chevron-forward" size={17} color={colors.muted} /></Pressable>
      </View>
    </ScrollView>
  );
}

function TransactionList({ items = transactions }: { items?: typeof transactions }) {
  return <View>{items.map((tx) => <Pressable key={tx.id} accessibilityRole="button" accessibilityLabel={`Open ${tx.merchant} transaction`} onPress={() => router.push({ pathname: '/transaction/[id]', params: { id: tx.id } })} style={({ pressed }) => [styles.transaction, pressed && styles.pressed]}><MerchantIcon icon={tx.icon} tone={tx.iconTone} size={44} /><View style={styles.transactionCopy}><Text numberOfLines={1} style={styles.merchant}>{tx.merchant}</Text><Text style={styles.meta}>{tx.date.replace(' 2026', '')}{tx.status !== 'Completed' ? ` · ${tx.status}` : ''}</Text></View><Text style={styles.amount}>{formatMoney(tx.amount)}</Text></Pressable>)}</View>;
}

function QuickAction({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.quickItem, pressed && styles.pressed]}><View style={styles.quickCircle}><Ionicons name={icon} size={22} color={colors.ink} /></View><Text style={styles.quickLabel}>{label}</Text></Pressable>;
}

function ProductTab({ tab, openSheet }: { tab: Exclude<TabName, 'Home'>; openSheet: (name: SheetName) => void }) {
  const config = {
    Invest: { title: 'Invest', value: '€1,280.40', change: '+2.4% this month', icon: 'stats-chart' as const, rows: [['Stocks', '€860.24'], ['ETFs', '€420.16'], ['Explore investments', '']] },
    Payments: { title: 'Payments', value: 'Send money', change: 'Fast transfers to friends and banks', icon: 'swap-horizontal' as const, rows: [['Yasmine', 'Recent'], ['Alex', 'Recent'], ['Bank transfer', 'New']] },
    Crypto: { title: 'Crypto', value: '€438.12', change: '+€18.46 today', icon: 'logo-bitcoin' as const, rows: [['Bitcoin', '€302.80'], ['Ethereum', '€135.32'], ['Explore crypto', '']] },
    RevPoints: { title: 'RevPoints', value: '1,842', change: 'Points available', icon: 'diamond' as const, rows: [['Airline miles', 'Transfer'], ['Stays', 'Earn 2×'], ['Experiences', 'Explore']] },
  }[tab];
  return <ScrollView style={styles.productPage} contentContainerStyle={styles.productContent}><View style={styles.productTop}><Text style={styles.productTitle}>{config.title}</Text><Pressable onPress={() => openSheet('more')} style={styles.headerButton}><Ionicons name="ellipsis-horizontal" size={22} color={colors.ink} /></Pressable></View><LinearGradient colors={['#285C88', '#20395F', '#11121A']} style={styles.productHero}><View style={styles.productHeroIcon}><Ionicons name={config.icon} size={28} color={colors.ink} /></View><Text style={styles.productValue}>{config.value}</Text><Text style={styles.productChange}>{config.change}</Text></LinearGradient><View style={styles.productRows}>{config.rows.map(([title, value]) => <Pressable key={title} onPress={() => openSheet('more')} style={({ pressed }) => [styles.productRow, pressed && styles.pressed]}><View style={styles.productRowIcon}><Ionicons name="ellipse" size={13} color={colors.blue} /></View><Text style={styles.productRowTitle}>{title}</Text><Text style={styles.productRowValue}>{value}</Text><Ionicons name="chevron-forward" size={18} color={colors.faint} /></Pressable>)}</View></ScrollView>;
}

function BottomNav({ active, onChange, bottomInset }: { active: TabName; onChange: (tab: TabName) => void; bottomInset: number }) {
  return <View style={[styles.bottomNav, { paddingBottom: Math.max(bottomInset, 8) }]}>{tabs.map((tab) => { const selected = tab.name === active; return <Pressable key={tab.name} accessibilityRole="tab" accessibilityState={{ selected }} onPress={() => onChange(tab.name)} style={styles.navItem}>{tab.name === 'Home' ? <Text style={[styles.homeMark, !selected && styles.homeMarkMuted]}>R</Text> : <Ionicons name={selected ? tab.activeIcon : tab.icon} size={21} color={selected ? colors.ink : colors.faint} />}<Text style={[styles.navLabel, selected && styles.navLabelActive]}>{tab.name}</Text></Pressable>; })}</View>;
}

function SearchScreen({ visible, query, setQuery, onClose }: { visible: boolean; query: string; setQuery: (value: string) => void; onClose: () => void }) {
  const filtered = useMemo(() => transactions.filter((tx) => `${tx.merchant} ${tx.category} ${tx.descriptor}`.toLowerCase().includes(query.toLowerCase())), [query]);
  return <Modal visible={visible} animationType="fade" presentationStyle="fullScreen" onRequestClose={onClose}><SafeAreaView style={styles.searchScreen} edges={['top', 'bottom']}><View style={styles.searchHeader}><Pressable onPress={onClose} style={styles.searchBack}><Ionicons name="arrow-back" size={24} color={colors.ink} /></Pressable><View style={styles.searchInputWrap}><Ionicons name="search" size={18} color={colors.muted} /><TextInput autoFocus value={query} onChangeText={setQuery} placeholder="Search transactions" placeholderTextColor={colors.faint} style={styles.searchInput} /></View></View><ScrollView contentContainerStyle={styles.searchResults} keyboardShouldPersistTaps="handled"><Text style={styles.searchResultTitle}>{query ? `${filtered.length} results` : 'Recent transactions'}</Text><View style={styles.searchList}><TransactionList items={filtered} /></View></ScrollView></SafeAreaView></Modal>;
}

function ActionSheet({ name, onClose }: { name: SheetName; onClose: () => void }) {
  const content = {
    profile: { title: 'Yassine Bentayfor', subtitle: 'Personal account', actions: ['Account', 'Security & privacy', 'Help'] },
    add: { title: 'Add money', subtitle: 'Choose how to fund your account', actions: ['Debit or credit card', 'Bank transfer', 'Apple Pay'] },
    transfer: { title: 'Move money', subtitle: 'Choose where it should go', actions: ['Bank recipient', 'Revolut friend', 'Between my accounts'] },
    more: { title: 'More', subtitle: 'Account tools and services', actions: ['Statements', 'Scheduled payments', 'Analytics'] },
    accounts: { title: 'Accounts', subtitle: 'Choose an account', actions: ['Personal · €4,821.72', 'Joint · €640.10', 'Savings · €8,204.55'] },
  }[name ?? 'more'];
  return <Modal visible={name !== null} transparent animationType="slide" onRequestClose={onClose}><Pressable style={styles.sheetBackdrop} onPress={onClose}><Pressable style={styles.sheet} onPress={() => undefined}><View style={styles.sheetHandle} /><Text style={styles.sheetTitle}>{content.title}</Text><Text style={styles.sheetSubtitle}>{content.subtitle}</Text><View style={styles.sheetActions}>{content.actions.map((action) => <Pressable key={action} onPress={onClose} style={({ pressed }) => [styles.sheetRow, pressed && styles.pressed]}><View style={styles.sheetRowIcon}><Ionicons name="arrow-forward" size={17} color={colors.ink} /></View><Text style={styles.sheetRowText}>{action}</Text><Ionicons name="chevron-forward" size={18} color={colors.faint} /></Pressable>)}</View><Pressable onPress={onClose} style={styles.sheetDone}><Text style={styles.sheetDoneText}>Close</Text></Pressable></Pressable></Pressable></Modal>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  shell: { flex: 1, width: '100%', maxWidth: 520, alignSelf: 'center', backgroundColor: colors.paper, ...(Platform.OS === 'web' ? { borderLeftWidth: 1, borderRightWidth: 1, borderColor: colors.line } : {}) },
  scroll: { flex: 1 }, homeContent: { paddingBottom: 22, backgroundColor: colors.paper }, accountBackdrop: { paddingHorizontal: 15, paddingBottom: 24, overflow: 'hidden', minHeight: 350 },
  topbar: { height: 62, flexDirection: 'row', alignItems: 'center', gap: 8 }, avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#18181B', borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)', alignItems: 'center', justifyContent: 'center' }, avatarText: { color: colors.ink, fontWeight: '800', fontSize: 11 },
  searchPill: { height: 38, flex: 1, minWidth: 0, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.20)', flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 13 }, searchLabel: { color: colors.ink, fontSize: 14 }, headerButton: { width: 38, height: 38, flexShrink: 0, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  accountSelector: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 8, marginTop: 25 }, accountSelectorText: { color: colors.ink, fontSize: 13, fontWeight: '600' }, balance: { color: colors.ink, fontSize: 40, fontWeight: '800', letterSpacing: -1.6, textAlign: 'center', fontVariant: ['tabular-nums'] }, balanceChange: { color: '#E0E0E4', fontSize: 12, textAlign: 'center', marginTop: 5 },
  quickActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 30 }, quickItem: { flex: 1, minWidth: 0, alignItems: 'center' }, quickCircle: { width: 49, height: 49, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.19)', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }, quickLabel: { color: colors.ink, fontSize: 11, fontWeight: '600' },
  activitySheet: { backgroundColor: colors.paper, paddingHorizontal: 15, minHeight: 440 }, frozenBanner: { minHeight: 64, backgroundColor: colors.blueSoft, borderRadius: radii.md, flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 14, marginTop: 14, marginBottom: 12 }, frozenIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.mist, alignItems: 'center', justifyContent: 'center' }, bannerCopy: { flex: 1 }, bannerTitle: { color: colors.ink, fontSize: 13, fontWeight: '800' }, bannerText: { color: colors.muted, fontSize: 11, marginTop: 4 },
  transactionPanel: { backgroundColor: colors.mist, borderRadius: 17, paddingHorizontal: 14 }, transaction: { minHeight: 70, flexDirection: 'row', alignItems: 'center', gap: 12 }, transactionCopy: { flex: 1, minWidth: 0 }, merchant: { color: colors.ink, fontSize: 15, fontWeight: '600' }, meta: { color: colors.muted, fontSize: 12, marginTop: 4 }, amount: { color: colors.ink, fontSize: 15, fontWeight: '600', fontVariant: ['tabular-nums'] }, seeAll: { height: 49, alignItems: 'center', justifyContent: 'center', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line }, seeAllText: { color: colors.ink, fontSize: 14, fontWeight: '700' },
  productsPanel: { height: 62, marginTop: 14, paddingHorizontal: 15, borderRadius: 17, backgroundColor: colors.mist, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, productsTitle: { color: colors.muted, fontSize: 13, fontWeight: '600' },
  bottomNav: { flexDirection: 'row', paddingTop: 8, paddingHorizontal: 3, backgroundColor: '#151517', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#2A2A2E' }, navItem: { flex: 1, minWidth: 0, alignItems: 'center', gap: 4, minHeight: 48 }, navLabel: { color: colors.faint, fontSize: 9, fontWeight: '600' }, navLabelActive: { color: colors.ink, fontWeight: '800' }, homeMark: { color: colors.ink, fontSize: 21, lineHeight: 22, fontWeight: '900', fontStyle: 'italic' }, homeMarkMuted: { color: colors.faint },
  productPage: { flex: 1, backgroundColor: colors.paper }, productContent: { paddingHorizontal: 15, paddingBottom: 30 }, productTop: { height: 70, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, productTitle: { color: colors.ink, fontSize: 28, fontWeight: '800', letterSpacing: -0.8 }, productHero: { minHeight: 230, borderRadius: 22, padding: 22, justifyContent: 'flex-end', overflow: 'hidden' }, productHeroIcon: { position: 'absolute', top: 20, right: 20, width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' }, productValue: { color: colors.ink, fontSize: 34, fontWeight: '800', letterSpacing: -1 }, productChange: { color: '#D0D0D4', fontSize: 12, marginTop: 7 }, productRows: { marginTop: 16, borderRadius: 17, backgroundColor: colors.mist, paddingHorizontal: 14 }, productRow: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 11, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line }, productRowIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.blueSoft, alignItems: 'center', justifyContent: 'center' }, productRowTitle: { flex: 1, color: colors.ink, fontSize: 14, fontWeight: '700' }, productRowValue: { color: colors.muted, fontSize: 12 },
  searchScreen: { flex: 1, backgroundColor: colors.paper }, searchHeader: { height: 62, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14 }, searchBack: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' }, searchInputWrap: { flex: 1, height: 42, borderRadius: 21, backgroundColor: colors.mist, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 13 }, searchInput: { flex: 1, color: colors.ink, fontSize: 14, paddingVertical: 0 }, searchResults: { paddingHorizontal: 15, paddingBottom: 30 }, searchResultTitle: { color: colors.ink, fontSize: 18, fontWeight: '800', marginTop: 16, marginBottom: 10 }, searchList: { backgroundColor: colors.mist, borderRadius: 17, paddingHorizontal: 14 },
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.68)', justifyContent: 'flex-end' }, sheet: { backgroundColor: colors.mist, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 22 }, sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#5A5A60', alignSelf: 'center', marginBottom: 20 }, sheetTitle: { color: colors.ink, fontSize: 25, fontWeight: '800', letterSpacing: -0.6 }, sheetSubtitle: { color: colors.muted, fontSize: 13, marginTop: 6 }, sheetActions: { marginTop: 20, borderTopWidth: 1, borderTopColor: colors.line }, sheetRow: { minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: 11, borderBottomWidth: 1, borderBottomColor: colors.line }, sheetRowIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#303036', alignItems: 'center', justifyContent: 'center' }, sheetRowText: { flex: 1, color: colors.ink, fontSize: 14, fontWeight: '700' }, sheetDone: { height: 52, borderRadius: 26, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center', marginTop: 18 }, sheetDoneText: { color: colors.paper, fontSize: 15, fontWeight: '800' }, pressed: { opacity: 0.55 },
});
