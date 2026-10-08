export const colors = {
  background: '#F3F6F7',
  surface: '#FFFFFF',
  primary: '#0E7C86',
  primaryDark: '#095A61',
  primarySoft: '#DFF1F2',
  accent: '#F2A541',
  text: '#16262B',
  muted: '#5E7176',
  faint: '#93A3A7',
  border: '#DCE4E6',
  danger: '#C2410C',
  dangerSoft: '#FDECE3',
  success: '#2F855A',
  successSoft: '#E3F4EA',
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };

export const radius = { sm: 8, md: 12, lg: 18, pill: 999 };

export const type = {
  title: { fontSize: 28, fontWeight: '800' as const, color: colors.text },
  heading: { fontSize: 18, fontWeight: '700' as const, color: colors.text },
  body: { fontSize: 15, color: colors.text },
  small: { fontSize: 13, color: colors.muted },
  label: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: colors.muted,
    letterSpacing: 0.6,
    textTransform: 'uppercase' as const,
  },
};
