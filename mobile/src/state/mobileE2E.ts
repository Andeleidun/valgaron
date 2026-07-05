export function isMobileE2EMode(): boolean {
  return process.env.EXPO_PUBLIC_VALGARON_E2E === '1';
}
