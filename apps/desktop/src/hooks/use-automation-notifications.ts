import { useEffect, useMemo, useRef, useState } from "react";
import { listApprovalRequests, onApprovalEvent } from "@brain-loop/desktop-client";
import type { ApprovalRequest } from "@brain-loop/brain-core";
import {
  getNotificationPermission,
  loadPermissionSoundEnabled,
  loadNotificationPreferences,
  notifyAutomationEvent,
  playPermissionRequiredCue,
  requestNotificationPermission,
  savePermissionSoundEnabled,
  saveNotificationPreferences,
  type AutomationNotification,
  type NotificationCategory,
  type NotificationPreferences,
} from "@/lib/notifications";

export function useAutomationNotifications() {
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>(() => loadNotificationPreferences());
  const [permissionSoundEnabled, setPermissionSoundEnabled] = useState(() => loadPermissionSoundEnabled());
  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequest[]>([]);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | "unsupported">(() => getNotificationPermission());
  const [lastNotification, setLastNotification] = useState<{ title: string; body: string; result: string } | null>(null);
  const notificationPrefsRef = useRef(notificationPrefs);
  const permissionSoundEnabledRef = useRef(permissionSoundEnabled);
  const soundedApprovalIdsRef = useRef<Set<string>>(new Set());

  const pendingApprovalRequests = useMemo(
    () => approvalRequests.filter((request) => request.status === "pending"),
    [approvalRequests],
  );

  const pendingApprovalByQueueId = useMemo(() => {
    const map = new Map<string, ApprovalRequest[]>();
    for (const request of pendingApprovalRequests) {
      if (!request.queueItemId) {
        continue;
      }
      const existing = map.get(request.queueItemId) ?? [];
      existing.push(request);
      map.set(request.queueItemId, existing);
    }
    return map;
  }, [pendingApprovalRequests]);

  useEffect(() => {
    notificationPrefsRef.current = notificationPrefs;
    saveNotificationPreferences(notificationPrefs);
  }, [notificationPrefs]);

  useEffect(() => {
    permissionSoundEnabledRef.current = permissionSoundEnabled;
    savePermissionSoundEnabled(permissionSoundEnabled);
  }, [permissionSoundEnabled]);

  function emitNotification(notification: AutomationNotification) {
    const result = notifyAutomationEvent(notification, notificationPrefsRef.current);
    if (result !== "disabled") {
      setLastNotification({ title: notification.title, body: notification.body, result });
    }
  }

  function refreshApprovals() {
    void listApprovalRequests()
      .then(setApprovalRequests)
      .catch(() => setApprovalRequests([]));
  }

  function handleApprovalSignal(request: ApprovalRequest) {
    setApprovalRequests((current) => {
      const index = current.findIndex((candidate) => candidate.id === request.id);
      if (index === -1) {
        return [request, ...current];
      }
      const next = [...current];
      next[index] = request;
      return next;
    });

    if (request.status !== "pending") {
      soundedApprovalIdsRef.current.delete(request.id);
      return;
    }

    emitNotification({
      category: "approval",
      title: "Approval needed",
      body: request.title,
      tag: `brain-loop-approval-${request.id}`,
    });

    if (
      permissionSoundEnabledRef.current &&
      notificationPrefsRef.current.approval &&
      !soundedApprovalIdsRef.current.has(request.id)
    ) {
      soundedApprovalIdsRef.current.add(request.id);
      playPermissionRequiredCue();
    }
  }

  useEffect(() => {
    let unlisten: (() => void)[] = [];
    void onApprovalEvent(handleApprovalSignal).then((listeners) => {
      unlisten = listeners;
    });

    return () => {
      unlisten.forEach((stop) => stop());
    };
  }, []);

  function toggleNotification(category: NotificationCategory) {
    setNotificationPrefs((current) => ({
      ...current,
      [category]: !current[category],
    }));
  }

  function requestNotifications() {
    void requestNotificationPermission().then((permission) => setNotificationPermission(permission));
  }

  return {
    approvalRequests,
    pendingApprovalRequests,
    pendingApprovalByQueueId,
    notificationPrefs,
    permissionSoundEnabled,
    notificationPermission,
    lastNotification,
    emitNotification,
    refreshApprovals,
    requestNotifications,
    setPermissionSoundEnabled,
    toggleNotification,
  };
}
