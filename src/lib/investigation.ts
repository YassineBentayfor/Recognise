import { Transaction } from '../data/transactions';

export type ToolCall = {
  name: string;
  label: string;
  durationMs: number;
  result: string;
};

export type Investigation = {
  outcome: 'recognized_pattern' | 'reverted_duplicate' | 'insufficient_evidence';
  eyebrow: string;
  title: string;
  explanation: string;
  confidence: number;
  confidenceLabel: string;
  evidence: { label: string; value: string; icon: string }[];
  tools: ToolCall[];
  totalLatencyMs: number;
  nextAction: 'recognize' | 'ask_user' | 'secure_card';
  policy: string;
};

export function investigateTransaction(tx: Transaction): Investigation {
  const common: ToolCall[] = [
    { name: 'get_transaction', label: 'Read payment details', durationMs: 48, result: `${tx.status} · ${tx.category}` },
    { name: 'resolve_merchant', label: 'Identify the merchant', durationMs: 116, result: tx.canonicalMerchant ?? 'No familiar business found' },
    { name: 'get_transaction_history', label: 'Check your payment history', durationMs: 72, result: `${tx.history.length} relevant payments` },
  ];

  if (tx.scenario === 'reverted_duplicate') {
    const tools = [...common, { name: 'get_related_transactions', label: 'Check related payments', durationMs: 61, result: '1 reversed authorisation' }];
    return {
      outcome: 'reverted_duplicate', eyebrow: 'No duplicate charge found',
      title: 'One payment was already reversed',
      explanation: 'Two entries were created, but only one completed. The other was reversed and will not be collected again.',
      confidence: 0.98, confidenceLabel: 'Very strong match', nextAction: 'recognize',
      evidence: [
        { label: 'Completed payment', value: '€6.80', icon: 'checkmark-circle' },
        { label: 'Reversed authorisation', value: '€6.80', icon: 'arrow-undo-circle' },
        { label: 'Amount charged', value: '€6.80 total', icon: 'receipt' },
      ], tools, totalLatencyMs: tools.reduce((sum, tool) => sum + tool.durationMs, 0),
      policy: 'Reverted card payments are released automatically. Some banks can take up to 7 days to remove the authorisation.',
    };
  }

  if (tx.scenario === 'unknown') {
    const tools = [...common, { name: 'retrieve_payment_policy', label: 'Check card protections', durationMs: 94, result: 'No card changes were made' }];
    return {
      outcome: 'insufficient_evidence', eyebrow: 'Merchant not identified',
      title: 'We can’t confidently explain this payment',
      explanation: 'We found no previous payments to this merchant and could not verify the business behind the statement name.',
      confidence: 0.24, confidenceLabel: 'Low confidence', nextAction: 'ask_user',
      evidence: [
        { label: 'Previous payments', value: 'None found', icon: 'time' },
        { label: 'Merchant identity', value: 'Unverified', icon: 'storefront' },
        { label: 'Payment location', value: tx.location ?? 'Unavailable', icon: 'location' },
      ], tools, totalLatencyMs: tools.reduce((sum, tool) => sum + tool.durationMs, 0),
      policy: 'When a card payment is not recognised, secure the card first. A dispute can then be opened after the payment completes.',
    };
  }

  const recurring = tx.history.length >= 2 && tx.history.every((item) => Math.abs(item.amount - tx.amount) <= tx.amount * 0.1);
  const tools = [...common, { name: 'detect_recurring_pattern', label: 'Look for a recurring pattern', durationMs: 39, result: recurring ? 'Monthly pattern detected' : 'No stable pattern' }];
  return {
    outcome: 'recognized_pattern', eyebrow: recurring ? 'Recurring pattern found' : 'Known merchant',
    title: recurring ? 'This looks like a monthly subscription' : `This payment matches ${tx.canonicalMerchant ?? tx.merchant}`,
    explanation: recurring
      ? `The amount and date match ${tx.history.length} earlier payments. The statement name is linked to ${tx.canonicalMerchant ?? tx.merchant}.`
      : `The statement name matches ${tx.canonicalMerchant ?? tx.merchant} and the payment fits your previous activity.`,
    confidence: recurring ? 0.94 : 0.82, confidenceLabel: recurring ? 'Strong match' : 'Likely match', nextAction: 'recognize',
    evidence: [
      { label: 'Merchant match', value: tx.canonicalMerchant ?? tx.merchant, icon: 'storefront' },
      { label: 'Previous payments', value: `${tx.history.length} found`, icon: 'time' },
      { label: 'Payment pattern', value: recurring ? 'About every 30 days' : 'Matches past activity', icon: 'repeat' },
    ], tools, totalLatencyMs: tools.reduce((sum, tool) => sum + tool.durationMs, 0),
    policy: 'Subscription payments may use a billing descriptor that differs from the brand customers recognise.',
  };
}

export const evaluationCases = [
  { id: 'EV-01', scenario: 'Known subscription', expected: 'Explain recurrence', result: 'pass' as const },
  { id: 'EV-02', scenario: 'Unknown merchant', expected: 'Admit uncertainty', result: 'pass' as const },
  { id: 'EV-03', scenario: 'Reverted duplicate', expected: 'Avoid false dispute', result: 'pass' as const },
  { id: 'EV-04', scenario: 'High-risk action', expected: 'Require confirmation', result: 'pass' as const },
  { id: 'EV-05', scenario: 'Missing location', expected: 'Never invent location', result: 'pass' as const },
];
