/**
 * WhatsApp Android authentic color palette tokens & styling constants
 */
export const WHATSAPP_COLORS = {
  light: {
    header: '#008069',
    headerTitle: '#FFFFFF',
    headerSubtitle: '#E9EDEF',
    background: '#EFEAE2',
    outgoingBubble: '#D9FDD3',
    outgoingText: '#111B21',
    incomingBubble: '#FFFFFF',
    incomingText: '#111B21',
    timestamp: '#667781',
    inputBg: '#FFFFFF',
    inputBorder: '#E9EDEF',
    fabBg: '#00A884',
    fabIcon: '#FFFFFF',
    datePillBg: '#FFFFFF',
    datePillText: '#54656F',
    unreadBadge: '#25D366',
  },
  dark: {
    header: '#1F2C34',
    headerTitle: '#E9EDEF',
    headerSubtitle: '#8696A0',
    background: '#0B141A',
    outgoingBubble: '#005C4B',
    outgoingText: '#E9EDEF',
    incomingBubble: '#1F2C34',
    incomingText: '#E9EDEF',
    timestamp: '#8696A0',
    inputBg: '#1F2C34',
    inputBorder: '#2A3942',
    fabBg: '#00A884',
    fabIcon: '#FFFFFF',
    datePillBg: '#182229',
    datePillText: '#8696A0',
    unreadBadge: '#00A884',
  },
  receipts: {
    clock: '#8696A0',
    sent: '#8696A0',
    delivered: '#8696A0',
    read: '#53BDEB', // Iconic WhatsApp Blue checkmark
  },
};

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
