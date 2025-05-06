// Custom colors for the application
export const customColors = {
  savings: {
    positive: {
      light: '#bae1bd',
      dark: '#003E05',
    },
    negative: {
      light: '#f8d7da',
      dark: '#673131',
    },
  },
}

export const getSavingsBackgroundColor = (isPositive: boolean, mode: 'light' | 'dark'): string => {
  return isPositive
    ? mode === 'dark' ? customColors.savings.positive.dark : customColors.savings.positive.light
    : mode === 'dark' ? customColors.savings.negative.dark : customColors.savings.negative.light
}
