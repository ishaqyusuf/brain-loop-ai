export type NotificationCategory = "blocked" | "submitted" | "approval" | "scheduler";

export type NotificationPreferences = Record<NotificationCategory, boolean>;

export interface AutomationNotification {
  category: NotificationCategory;
  title: string;
  body: string;
  tag?: string;
}

const storageKey = "brain-loop.notification-preferences";

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
