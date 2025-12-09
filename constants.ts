
import { Track } from './types';

// List of public Hifi API instances provided by the user.
export const API_INSTANCES = [
  'https://frankfurt.monochrome.tf',
  'https://triton.squid.wtf', 
  'https://ohio.monochrome.tf',
  'https://virginia.monochrome.tf',
  'https://oregon.monochrome.tf',
  'https://singapore.monochrome.tf',
  'https://wolf.qqdl.site',
  'https://maus.qqdl.site',
  'https://vogel.qqdl.site',
  'https://katze.qqdl.site',
  'https://hund.qqdl.site',
];

// Select the first instance by default
export const API_BASE_URL = API_INSTANCES[0];

export const DEFAULT_VOLUME = 0.5;
