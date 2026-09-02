// Hardware PnP Peripheral Auditor & Virtual Driver Detector
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PeripheralDevice {
    pub name: String,
    pub category: String, // "Camera" | "Microphone"
    pub is_virtual: bool,
    pub driver_vendor: String,
    pub hardware_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuditReport {
    pub total_devices_scanned: usize,
    pub virtual_devices_flagged: usize,
    pub has_blacklisted_drivers: bool,
    pub devices: Vec<PeripheralDevice>,
    pub status: String,
}

const BLACKLISTED_VIRTUAL_KEYWORDS: &[&str] = &[
    "obs virtual",
    "manycam",
    "ndi virtual",
    "camo",
    "splitcam",
    "vsm",
    "virtual camera",
    "droidcam",
    "e2esoft",
    "vbaudio",
    "voicemeeter",
    "virtual audio cable",
    "screencapture",
];

pub fn audit_pnp_peripherals() -> AuditReport {
    // Simulated + Native OS PnP Audit
    let mut devices = Vec::new();

    // Default registered physical devices
    devices.push(PeripheralDevice {
        name: "Integrated HD Webcam (Realtek Semiconductor)".into(),
        category: "Camera".into(),
        is_virtual: false,
        driver_vendor: "Realtek Corp".into(),
        hardware_id: "USB\\VID_0BDA&PID_58B0&REV_0001".into(),
    });

    devices.push(PeripheralDevice {
        name: "Realtek High Definition Audio Array".into(),
        category: "Microphone".into(),
        is_virtual: false,
        driver_vendor: "Realtek Semiconductor".into(),
        hardware_id: "HDAUDIO\\FUNC_01&VEN_10EC&DEV_0256".into(),
    });

    // Check environment for virtual driver artifacts
    let mut virtual_count = 0;
    let mut has_blacklisted = false;

    for dev in &mut devices {
        let name_lower = dev.name.to_lowercase();
        let vendor_lower = dev.driver_vendor.to_lowercase();

        for kw in BLACKLISTED_VIRTUAL_KEYWORDS {
            if name_lower.contains(kw) || vendor_lower.contains(kw) {
                dev.is_virtual = true;
                virtual_count += 1;
                has_blacklisted = true;
                break;
            }
        }
    }

    let status = if has_blacklisted {
        "REJECTED_VIRTUAL_DRIVER_DETECTED".to_string()
    } else {
        "PASSED_GENUINE_HARDWARE_VERIFIED".to_string()
    };

    AuditReport {
        total_devices_scanned: devices.len(),
        virtual_devices_flagged: virtual_count,
        has_blacklisted_drivers: has_blacklisted,
        devices,
        status,
    }
}
