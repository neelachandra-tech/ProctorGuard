pub mod driver_audit;
pub mod hypervisor;
pub mod keyboard_hook;

use driver_audit::{audit_pnp_peripherals, AuditReport};
use hypervisor::{audit_hypervisor, HypervisorStatus};
use keyboard_hook::{
    calculate_dynamics_profile, init_keyboard_hook, record_keystroke_sample, stop_keyboard_hook,
    KeystrokeDynamicsProfile, KeystrokeEvent,
};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct SystemSecurityState {
    pub hypervisor: HypervisorStatus,
    pub driver_audit: AuditReport,
    pub hook_active: bool,
    pub timestamp_ms: u64,
}

#[tauri::command]
fn get_system_security_state() -> SystemSecurityState {
    let hypervisor = audit_hypervisor();
    let driver_audit = audit_pnp_peripherals();
    let hook_active = true;

    SystemSecurityState {
        hypervisor,
        driver_audit,
        hook_active,
        timestamp_ms: chrono::Utc::now().timestamp_millis() as u64,
    }
}

#[tauri::command]
fn start_keyboard_lockdown() -> bool {
    init_keyboard_hook()
}

#[tauri::command]
fn stop_keyboard_lockdown() -> bool {
    stop_keyboard_hook()
}

#[tauri::command]
fn process_keystroke_sample(
    key_code: u32,
    key_char: String,
    event_type: String,
    timestamp_us: u64,
    dwell_time_ms: Option<f64>,
    flight_time_ms: Option<f64>,
) -> KeystrokeEvent {
    record_keystroke_sample(
        key_code,
        &key_char,
        &event_type,
        timestamp_us,
        dwell_time_ms,
        flight_time_ms,
    )
}

#[tauri::command]
fn evaluate_keystroke_biometric(
    events: Vec<KeystrokeEvent>,
    baseline_dwell: f64,
    baseline_flight: f64,
) -> KeystrokeDynamicsProfile {
    calculate_dynamics_profile(&events, baseline_dwell, baseline_flight)
}

pub fn run_app() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_system_security_state,
            start_keyboard_lockdown,
            stop_keyboard_lockdown,
            process_keystroke_sample,
            evaluate_keystroke_biometric
        ])
        .run(tauri::generate_context!())
        .expect("error while running proctorguard desktop client");
}
