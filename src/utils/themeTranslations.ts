import type { AppThemeId } from '@/app/theme';
import { m } from '@/paraglide/messages.js';

export function getThemeLabel(themeId: AppThemeId) {
  switch (themeId) {
    case 'daybreak':
      return `${m.theme_daybreak_label()}`;
    case 'midnight':
      return `${m.theme_midnight_label()}`;
    case 'ember':
      return `${m.theme_ember_label()}`;
    case 'atlas':
      return `${m.theme_atlas_label()}`;
    case 'cipher':
      return `${m.theme_cipher_label()}`;
    case 'glacier':
      return `${m.theme_glacier_label()}`;
  }
}
