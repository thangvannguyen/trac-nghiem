import type { FolderColor } from '../lib/types';

export const PALETTE: Record<FolderColor, { light: string; main: string; dark: string }> = {
  peach: { light: '#FFE8DC', main: '#FFB59A', dark: '#E8805C' },
  mint: { light: '#DDF7EC', main: '#8FE0BE', dark: '#3FBF8C' },
  sky: { light: '#E0F0FF', main: '#9CCBFF', dark: '#4D9EF5' },
  lilac: { light: '#EEE6FF', main: '#C5AEFF', dark: '#8C6CF0' },
  lemon: { light: '#FFF6CC', main: '#FFE27A', dark: '#E0AE00' },
  rose: { light: '#FFE3EA', main: '#FFA8BC', dark: '#F2647F' },
};
