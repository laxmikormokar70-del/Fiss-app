export const formatWhatsAppNumber = (phone: string) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11 && cleaned.startsWith('01')) {
    return '88' + cleaned;
  }
  return cleaned;
};
