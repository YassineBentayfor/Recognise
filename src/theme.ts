export const colors = {
  ink: '#FFFFFF',
  muted: '#A7A7AF',
  faint: '#72727A',
  paper: '#000000',
  mist: '#1B1B1F',
  line: '#303036',
  blue: '#75A1FF',
  blueSoft: '#18233D',
  mint: '#49C9A5',
  mintSoft: '#122A24',
  coral: '#FF5668',
  coralSoft: '#351A20',
  amber: '#F2B84B',
  amberSoft: '#332915',
} as const;

export const radii = { sm: 12, md: 18, lg: 26, pill: 999 } as const;
export const space = { xs: 6, sm: 10, md: 16, lg: 24, xl: 32 } as const;

export const shadows = {
  floating: {
    shadowColor: '#111318',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
  },
};
