import { invoke } from '@tauri-apps/api/core';

export interface NativeHypervisorStatus {
  is_vm: boolean;
  hypervisor_present_bit: boolean;
  vendor_id: string;
  vm_features_detected: string[];
  risk_level: string;
}

export interface NativePeripheralDevice {
  name: string;
  category: string;
  is_virtual: boolean;
  driver_vendor: string;
  hardware_id: string;
}

export interface NativeAuditReport {
  total_devices_scanned: number;
  virtual_devices_flagged: number;
  has_blacklisted_drivers: boolean;
  devices: NativePeripheralDevice[];
  status: string;
}

export interface NativeSystemSecurityState {
  hypervisor: NativeHypervisorStatus;
  driver_audit: NativeAuditReport;
  hook_active: boolean;
  timestamp_ms: number;
}

export interface NativeKeystrokeEvent {
  key_code: number;
  key_char: string;
  event_type: string;
  timestamp_us: number;
  dwell_time_ms: number | null;
  flight_time_ms: number | null;
  blocked: boolean;
}

export interface NativeDynamicsProfile {
  average_dwell_ms: number;
  average_flight_ms: number;
  dwell_variance: number;
  total_events: number;
  anomaly_score: number;
}

export const isTauri = (): boolean => {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
};

export const fetchNativeSecurityState = async (): Promise<NativeSystemSecurityState | null> => {
  if (!isTauri()) return null;
  try {
    return await invoke<NativeSystemSecurityState>('get_system_security_state');
  } catch (err) {
    console.warn('[Tauri Bridge] Failed to invoke get_system_security_state:', err);
    return null;
  }
};

export const startNativeKeyboardLockdown = async (): Promise<boolean> => {
  if (!isTauri()) return false;
  try {
    return await invoke<boolean>('start_keyboard_lockdown');
  } catch (err) {
    console.warn('[Tauri Bridge] Failed to invoke start_keyboard_lockdown:', err);
    return false;
  }
};

export const stopNativeKeyboardLockdown = async (): Promise<boolean> => {
  if (!isTauri()) return false;
  try {
    return await invoke<boolean>('stop_keyboard_lockdown');
  } catch (err) {
    console.warn('[Tauri Bridge] Failed to invoke stop_keyboard_lockdown:', err);
    return false;
  }
};

export const evaluateNativeKeystrokes = async (
  events: NativeKeystrokeEvent[],
  baselineDwell: number,
  baselineFlight: number
): Promise<NativeDynamicsProfile | null> => {
  if (!isTauri()) return null;
  try {
    return await invoke<NativeDynamicsProfile>('evaluate_keystroke_biometric', {
      events,
      baselineDwell,
      baselineFlight,
    });
  } catch (err) {
    console.warn('[Tauri Bridge] Failed to invoke evaluate_keystroke_biometric:', err);
    return null;
  }
};
