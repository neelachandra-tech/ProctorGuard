import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { BiometricEnrollment } from './components/BiometricEnrollment';
import { ExamineeConsole } from './components/ExamineeConsole';
import { ExaminerPortal } from './components/ExaminerPortal';
import { K8sTopology } from './components/K8sTopology';
import { ExamineeProfile, ViolationEvent } from './types/proctor';
import { verifySessionWithGateway, postTelemetryEvent } from './utils/api';
import {
  fetchNativeSecurityState,
  startNativeKeyboardLockdown,
  stopNativeKeyboardLockdown,
  isTauri,
} from './utils/tauriBridge';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ENROLLMENT' | 'EXAMINEE' | 'EXAMINER' | 'K8S'>('EXAMINEE');
  const [isNativeKiosk, setIsNativeKiosk] = useState<boolean>(false);

  // Examinee Profile
  const [profile, setProfile] = useState<ExamineeProfile>({
    id: 'EX-9042',
    name: 'Alex Rivera',
    email: 'alex.rivera@university.edu',
    course: 'CS-401 Distributed Systems',
    examId: 'EXAM-2026-FINAL',
    face: {
      enrolledAt: Date.now() - 3600000,
      embeddingVector512: Array.from({ length: 512 }, () => 0.05),
      faceMeshLandmarksCount: 468,
      yawPitchBaseline: { yaw: 0.1, pitch: -0.5 },
      status: 'VERIFIED',
    },
    voice: {
      enrolledAt: Date.now() - 3600000,
      pitchBaselineHz: 142.5,
      spectralFingerprint: [0.1, 0.4, 0.8, 0.6, 0.3],
      audioSampleDurationSec: 5.0,
      status: 'VERIFIED',
    },
    keystroke: {
      enrolledAt: Date.now() - 3600000,
      averageDwellMs: 108.4,
      averageFlightMs: 135.2,
      sampleCount: 45,
      status: 'VERIFIED',
    },
    isVmDetected: false,
    pnpAudited: true,
  });

  const [violations, setViolations] = useState<ViolationEvent[]>([]);
  const [securityScore, setSecurityScore] = useState<number>(98);
  const [sessionToken, setSessionToken] = useState<string>('');

  // Native Tauri v2 Kiosk Integration
  useEffect(() => {
    if (isTauri()) {
      setIsNativeKiosk(true);
      fetchNativeSecurityState().then((state) => {
        if (state) {
          setProfile((prev) => ({
            ...prev,
            isVmDetected: state.hypervisor.is_vm,
            pnpAudited: !state.driver_audit.has_blacklisted_drivers,
          }));
        }
      });

      startNativeKeyboardLockdown();

      return () => {
        stopNativeKeyboardLockdown();
      };
    }
  }, []);

  // Initial Session Verification with Backend Gateway
  useEffect(() => {
    verifySessionWithGateway({
      sessionId: `SESS-${profile.id.replace('EX-', '')}`,
      examineeId: profile.id,
      examineeName: profile.name,
      course: profile.course,
      examId: profile.examId,
      deviceToken: isNativeKiosk ? 'DEV-TOK-TAURI-NATIVE-9042' : 'DEV-TOK-BROWSER-9042',
      isVm: profile.isVmDetected,
    }).then((res) => {
      if (res.sessionJwt) {
        setSessionToken(res.sessionJwt);
      }
    });
  }, [profile.id, profile.name, profile.course, profile.examId, profile.isVmDetected, isNativeKiosk]);

  const handleEnrollmentComplete = (updated: ExamineeProfile) => {
    setProfile(updated);
    setActiveTab('EXAMINEE');
  };

  const handleViolationTriggered = (evt: ViolationEvent) => {
    setViolations((prev) => [evt, ...prev]);
    setSecurityScore((prev) => Math.max(25, prev - 15));

    // Post to API Gateway & Fusion Engine
    postTelemetryEvent({
      sessionId: `SESS-${profile.id.replace('EX-', '')}`,
      examineeId: profile.id,
      examineeName: profile.name,
      eventType: evt.type,
      severity: evt.severity,
      description: evt.description,
      metrics: evt.metrics as Record<string, unknown>,
      timestampMs: evt.timestampMs,
    });
  };

  // Global Browser Lockdown Interceptors & Tab Switch Watchdog
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Intercept Alt+Tab, Win Key, PrintScreen, F12, Ctrl+C, Ctrl+V, Ctrl+U
      if (
        e.key === 'PrintScreen' ||
        (e.altKey && e.key === 'Tab') ||
        e.key === 'Meta' ||
        e.key === 'F12' ||
        (e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'u' || e.key === 'i'))
      ) {
        e.preventDefault();
        e.stopPropagation();

        const evt: ViolationEvent = {
          id: `EVT-${Date.now()}`,
          examineeId: profile.id,
          examineeName: profile.name,
          timestampMs: Date.now(),
          formattedTime: new Date().toLocaleTimeString(),
          type: 'KEYBOARD_ANOMALY',
          severity: 'HIGH',
          description: `Blocked forbidden shortcut attempt (${e.key}).`,
          metrics: { keystrokeAnomalyScore: 0.95 },
        };
        handleViolationTriggered(evt);
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        const evt: ViolationEvent = {
          id: `EVT-${Date.now()}`,
          examineeId: profile.id,
          examineeName: profile.name,
          timestampMs: Date.now(),
          formattedTime: new Date().toLocaleTimeString(),
          type: 'GAZE_STRAY',
          severity: 'CRITICAL',
          description: 'Candidate switched window/tab focus away from exam container.',
          metrics: { gazeYaw: 45.0, gazePitch: -30.0 },
        };
        handleViolationTriggered(evt);
      }
    };

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [profile]);

  return (
    <div className="min-h-screen bg-[#0a0d14] text-slate-100 flex flex-col font-sans select-none">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        systemSecurityScore={securityScore}
        isNativeKiosk={isNativeKiosk}
      />

      <main className="flex-1 pb-12">
        {activeTab === 'ENROLLMENT' && (
          <BiometricEnrollment profile={profile} onEnrollmentComplete={handleEnrollmentComplete} />
        )}

        {activeTab === 'EXAMINEE' && (
          <ExamineeConsole profile={profile} onViolationTriggered={handleViolationTriggered} />
        )}

        {activeTab === 'EXAMINER' && <ExaminerPortal />}

        {activeTab === 'K8S' && <K8sTopology />}
      </main>

      <footer className="border-t border-slate-900 bg-[#07090f] py-4 text-center text-xs font-mono text-slate-500">
        ProctorGuard v2.4 • Tauri v2 OS Lockdown • DeBERTa Collusion Engine • K8s Scaling (1,000+ Sessions)
      </footer>
    </div>
  );
};
