/**
 * MindFlow Chat Design Tokens & Formatting Utilities
 * Custom-tailored to MindFlow's Indigo / Slate / Cyber-Glassmorphic aesthetic.
 */

export const CHAT_COLORS = {
  light: {
    header: '#FFFFFF',
    headerBorder: '#E2E8F0', // slate-200
    headerTitle: '#0F172A', // slate-900
    headerSubtitle: '#64748B', // slate-500
    background: '#F8FAFC', // slate-50
    outgoingBubble: '#4F46E5', // indigo-600
    outgoingBubbleGradient: 'linear-gradient(135deg, #4F46E5 0%, #4338CA 100%)',
    outgoingText: '#FFFFFF',
    incomingBubble: '#FFFFFF',
    incomingBorder: '#E2E8F0', // slate-200
    incomingText: '#0F172A', // slate-900
    timestamp: '#94A3B8', // slate-400
    outgoingTimestamp: '#C7D2FE', // indigo-200
    inputBg: '#FFFFFF',
    inputBorder: '#E2E8F0', // slate-200
    fabBg: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)', // indigo-600 to purple-600
    fabIcon: '#FFFFFF',
    datePillBg: 'rgba(255, 255, 255, 0.9)',
    datePillBorder: '#E2E8F0',
    datePillText: '#64748B',
    unreadBadge: '#4F46E5', // indigo-600
  },
  dark: {
    header: '#0F172A', // slate-900
    headerBorder: '#1E293B', // slate-800
    headerTitle: '#F8FAFC', // slate-50
    headerSubtitle: '#94A3B8', // slate-400
    background: '#020617', // slate-950
    outgoingBubble: '#4F46E5', // indigo-600
    outgoingBubbleGradient: 'linear-gradient(135deg, #4F46E5 0%, #3730A3 100%)',
    outgoingText: '#FFFFFF',
    incomingBubble: '#0F172A', // slate-900
    incomingBorder: '#1E293B', // slate-800
    incomingText: '#F8FAFC', // slate-50
    timestamp: '#64748B', // slate-500
    outgoingTimestamp: '#C7D2FE', // indigo-200
    inputBg: '#0F172A', // slate-900
    inputBorder: '#1E293B', // slate-800
    fabBg: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', // indigo-500 to purple-500
    fabIcon: '#FFFFFF',
    datePillBg: 'rgba(15, 23, 42, 0.9)',
    datePillBorder: '#1E293B',
    datePillText: '#94A3B8',
    unreadBadge: '#6366F1', // indigo-500
  },
  receipts: {
    clock: '#94A3B8',
    sent: '#94A3B8',
    delivered: '#94A3B8',
    read: '#38BDF8', // Crisp Sky-400 (MindFlow read state)
  },
};

// Aliased for seamless migration
export const WHATSAPP_COLORS = CHAT_COLORS;

/**
 * Format message time: "10:45 AM"
 */
export function formatMessageTime(dateString?: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Format date divider: "TODAY", "YESTERDAY", or "18 NOV 2026"
 */
export function formatDateDivider(dateString?: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'TODAY';
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return 'YESTERDAY';
  }

  return date.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase();
}

/**
 * Format human-readable file size (e.g. "2.4 MB", "340 KB")
 */
export function formatFileSize(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return '';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
