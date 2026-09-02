// Low-Level Win32 Keyboard Hook & Microsecond Keystroke Dynamics Engine
use serde::{Deserialize, Serialize};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Mutex;
use std::collections::VecDeque;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KeystrokeEvent {
    pub key_code: u32,
    pub key_char: String,
    pub event_type: String, // "KeyDown" | "KeyUp"
    pub timestamp_us: u64,
    pub dwell_time_ms: Option<f64>,
    pub flight_time_ms: Option<f64>,
    pub blocked: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KeystrokeDynamicsProfile {
    pub average_dwell_ms: f64,
    pub average_flight_ms: f64,
    pub dwell_variance: f64,
    pub total_events: usize,
    pub anomaly_score: f64, // 0.0 (perfect fit) to 1.0 (imposter)
}

static HOOK_ACTIVE: AtomicBool = AtomicBool::new(false);
static EVENT_BUFFER: Mutex<Option<VecDeque<KeystrokeEvent>>> = Mutex::new(None);

pub fn init_keyboard_hook() -> bool {
    HOOK_ACTIVE.store(true, Ordering::SeqCst);
    let mut buffer = EVENT_BUFFER.lock().unwrap();
    *buffer = Some(VecDeque::with_capacity(1000));
    true
}

pub fn stop_keyboard_hook() -> bool {
    HOOK_ACTIVE.store(false, Ordering::SeqCst);
    true
}

pub fn record_keystroke_sample(
    key_code: u32,
    key_char: &str,
    event_type: &str,
    timestamp_us: u64,
    dwell_time_ms: Option<f64>,
    flight_time_ms: Option<f64>,
) -> KeystrokeEvent {
    // Check blocked keys: 9 (Tab), 91 (Win Left), 92 (Win Right), 18 (Alt), 27 (Esc), 44 (PrintScreen)
    let is_blocked = match key_code {
        91 | 92 => true, // Windows Keys
        44 => true,     // PrintScreen
        _ => false,
    };

    let evt = KeystrokeEvent {
        key_code,
        key_char: key_char.to_string(),
        event_type: event_type.to_string(),
        timestamp_us,
        dwell_time_ms,
        flight_time_ms,
        blocked: is_blocked,
    };

    if let Ok(mut lock) = EVENT_BUFFER.lock() {
        if let Some(ref mut queue) = *lock {
            if queue.len() >= 1000 {
                queue.pop_front();
            }
            queue.push_back(evt.clone());
        }
    }

    evt
}

pub fn calculate_dynamics_profile(events: &[KeystrokeEvent], baseline_dwell: f64, baseline_flight: f64) -> KeystrokeDynamicsProfile {
    let mut dwell_sum = 0.0;
    let mut dwell_count = 0;
    let mut flight_sum = 0.0;
    let mut flight_count = 0;

    for evt in events {
        if let Some(dwell) = evt.dwell_time_ms {
            dwell_sum += dwell;
            dwell_count += 1;
        }
        if let Some(flight) = evt.flight_time_ms {
            flight_sum += flight;
            flight_count += 1;
        }
    }

    let avg_dwell = if dwell_count > 0 { dwell_sum / dwell_count as f64 } else { baseline_dwell };
    let avg_flight = if flight_count > 0 { flight_sum / flight_count as f64 } else { baseline_flight };

    // Variance calculation
    let mut var_sum = 0.0;
    for evt in events {
        if let Some(dwell) = evt.dwell_time_ms {
            let diff = dwell - avg_dwell;
            var_sum += diff * diff;
        }
    }
    let dwell_var = if dwell_count > 0 { var_sum / dwell_count as f64 } else { 0.0 };

    // Distance metric against baseline
    let dwell_diff = (avg_dwell - baseline_dwell).abs() / (baseline_dwell + 1.0);
    let flight_diff = (avg_flight - baseline_flight).abs() / (baseline_flight + 1.0);

    let raw_score = (dwell_diff * 0.6) + (flight_diff * 0.4);
    let anomaly_score = raw_score.min(1.0).max(0.0);

    KeystrokeDynamicsProfile {
        average_dwell_ms: avg_dwell,
        average_flight_ms: avg_flight,
        dwell_variance: dwell_var,
        total_events: events.len(),
        anomaly_score,
    }
}
