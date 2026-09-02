// CPUID Hypervisor & Virtual Machine Audit Module
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HypervisorStatus {
    pub is_vm: bool,
    pub hypervisor_present_bit: bool,
    pub vendor_id: String,
    pub vm_features_detected: Vec<String>,
    pub risk_level: String,
}

#[cfg(target_arch = "x86_64")]
use std::arch::x86_64::__cpuid;

pub fn audit_hypervisor() -> HypervisorStatus {
    let mut is_vm = false;
    let mut hypervisor_present_bit = false;
    let mut vendor_id = String::from("Physical Hardware");
    let mut vm_features_detected = Vec::new();

    #[cfg(target_arch = "x86_64")]
    {
        let cpuid_1 = __cpuid(1);
        if (cpuid_1.ecx & (1 << 31)) != 0 {
            hypervisor_present_bit = true;
            is_vm = true;
            vm_features_detected.push("CPUID ECX Bit 31 (Hypervisor Present)".to_string());
        }

        let cpuid_hv = __cpuid(0x40000000);
        let mut vendor_bytes = Vec::new();
        vendor_bytes.extend_from_slice(&cpuid_hv.ebx.to_le_bytes());
        vendor_bytes.extend_from_slice(&cpuid_hv.ecx.to_le_bytes());
        vendor_bytes.extend_from_slice(&cpuid_hv.edx.to_le_bytes());

        if let Ok(vendor_str) = String::from_utf8(vendor_bytes) {
            let trimmed = vendor_str.trim_matches('\0').trim();
            if !trimmed.is_empty() {
                vendor_id = trimmed.to_string();
                match trimmed {
                    "KVMKVMKVM" => vm_features_detected.push("QEMU/KVM Hypervisor Detected".into()),
                    "VMwareVMware" => vm_features_detected.push("VMware Workstation/ESXi Detected".into()),
                    "Microsoft Hv" => vm_features_detected.push("Microsoft Hyper-V / WSL2 Detected".into()),
                    "VBoxVBoxVBox" => vm_features_detected.push("Oracle VirtualBox Detected".into()),
                    "XenVMMXenVMM" => vm_features_detected.push("Xen Hypervisor Detected".into()),
                    "prl hyperv" => vm_features_detected.push("Parallels Desktop Detected".into()),
                    _ => {
                        if hypervisor_present_bit {
                            vm_features_detected.push(format!("Generic Hypervisor Vendor: {}", trimmed));
                        }
                    }
                }
            }
        }
    }

    #[cfg(not(target_arch = "x86_64"))]
    {
        vendor_id = "Non-x86 Architecture (Audit via OS API)".into();
    }

    let risk_level = if is_vm {
        "CRITICAL_RISK_VM_DETECTED".to_string()
    } else {
        "SECURE_PHYSICAL_BARE_METAL".to_string()
    };

    HypervisorStatus {
        is_vm,
        hypervisor_present_bit,
        vendor_id,
        vm_features_detected,
        risk_level,
    }
}
