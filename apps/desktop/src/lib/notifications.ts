export type NotificationCategory = "blocked" | "submitted" | "approval" | "scheduler";

export type NotificationPreferences = Record<NotificationCategory, boolean>;

export interface AutomationNotification {
  category: NotificationCategory;
  title: string;
  body: string;
  tag?: string;
}

const storageKey = "brain-loop.notification-preferences";
const permissionSoundStorageKey = "brain-loop.permission-sound-enabled";

export const defaultNotificationPreferences: NotificationPreferences = {
  blocked: true,
  submitted: true,
  approval: true,
  scheduler: true,
};

export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (!("Notification" in window)) {
    return "unsupported";
  }
  return Notification.permission;
}

export function loadNotificationPreferences(): NotificationPreferences {
  try {
    const stored = window.localStorage.getItem(storageKey);
    if (!stored) {
      return defaultNotificationPreferences;
    }

    return {
      ...defaultNotificationPreferences,
      ...JSON.parse(stored),
    };
  } catch {
    return defaultNotificationPreferences;
  }
}

export function saveNotificationPreferences(preferences: NotificationPreferences) {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(preferences));
  } catch {
    // Notification preferences should never break the app shell.
  }
}

export function loadPermissionSoundEnabled() {
  try {
    const stored = window.localStorage.getItem(permissionSoundStorageKey);
    return stored == null ? true : stored === "true";
  } catch {
    return true;
  }
}

export function savePermissionSoundEnabled(enabled: boolean) {
  try {
    window.localStorage.setItem(permissionSoundStorageKey, String(enabled));
  } catch {
    // Sound preferences should never break the app shell.
  }
}

export async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    return "unsupported";
  }
  return await Notification.requestPermission();
}

export function notifyAutomationEvent(
  notification: AutomationNotification,
  preferences: NotificationPreferences,
) {
  if (!preferences[notification.category]) {
    return "disabled";
  }

  if (!("Notification" in window)) {
    return "unsupported";
  }

  if (Notification.permission !== "granted") {
    return Notification.permission;
  }

  try {
    new Notification(notification.title, {
      body: notification.body,
      tag: notification.tag,
    });
    return "sent";
  } catch {
    return "failed";
  }
}

export function playPermissionRequiredCue() {
  try {
    const audioWindow = window as Window & typeof globalThis & {
      webkitAudioContext?: typeof AudioContext;
    };
    const AudioContextCtor = window.AudioContext || audioWindow.webkitAudioContext;
    if (!AudioContextCtor) {
      return "unsupported";
    }

    const context = new AudioContextCtor();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const now = context.currentTime;

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, now);
    oscillator.frequency.setValueAtTime(660, now + 0.08);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.08, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.24);
    oscillator.addEventListener("ended", () => void context.close());
    return "played";
  } catch {
    return "failed";
  }
}
