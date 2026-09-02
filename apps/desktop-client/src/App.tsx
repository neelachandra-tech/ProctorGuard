import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { BiometricEnrollment } from './components/BiometricEnrollment';
import { ExamineeConsole } from './components/ExamineeConsole';
import { ExaminerPortal } from './components/ExaminerPortal';
import { K8sTopology } from './components/K8sTopology';
import { ExamineeProfile, ViolationEvent } from './types/proctor';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ENROLLMENT' | 'EXAMINEE' | 'EXAMINER' | 'K8S'>('EXAMINEE');

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

  const handleEnrollmentComplete = (updated: ExamineeProfile) => {
    setProfile(updated);
    setActiveTab('EXAMINEE');
  };

  const handleViolationTriggered = (evt: ViolationEvent) => {
    setViolations((prev) => [evt, ...prev]);
    setSecurityScore((prev) => Math.max(25, prev - 15));
  };

  return (
    <div className="min-h-screen bg-[#0a0d14] text-slate-100 flex flex-col font-sans">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} systemSecurityScore={securityScore} />

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
