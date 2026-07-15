import { getServiceWorkerUrl } from './serviceWorkerUrl';

export function registerServiceWorker(): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) {
    return;
  }

  window.addEventListener('load', () => {
    const serviceWorkerUrl = getServiceWorkerUrl(
      import.meta.env.BASE_URL,
      import.meta.env.VITE_DEPLOY_VERSION
    );
    const shouldReloadOnUpdate = Boolean(navigator.serviceWorker.controller);
    let isReloading = false;

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (shouldReloadOnUpdate && !isReloading) {
        isReloading = true;
        window.location.reload();
      }
    });

    navigator.serviceWorker
      .register(serviceWorkerUrl, { updateViaCache: 'none' })
      .then((registration) => registration.update())
      .catch(() => {
        // The app remains fully usable online if installability is unavailable.
      });
  });
}
