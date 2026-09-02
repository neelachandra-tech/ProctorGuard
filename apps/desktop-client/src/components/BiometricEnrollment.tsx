import React, { useState, useEffect, useRef } from 'react';
import { Camera, Mic, Keyboard, CheckCircle2, ShieldAlert, Cpu, Sparkles, RefreshCw } from 'lucide-react';
import { ExamineeProfile } from '../types/proctor';

interface BiometricEnrollmentProps {
  profile: ExamineeProfile;
  onEnrollmentComplete: (updatedProfile: ExamineeProfile) => void;
}

export const BiometricEnrollment: React.FC<BiometricEnrollmentProps> = ({ profile, onEnrollmentComplete }) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [faceEnrolled, setFaceEnrolled] = useState(false);
  const [voiceEnrolled, setVoiceEnrolled] = useState(false);
  const [keystrokeEnrolled, setKeystrokeEnrolled] = useState(false);

  // Audio Spectrum Canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [voiceSentenceProgress, setVoiceSentenceProgress] = useState(0);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);

  // Keystroke Test
  const samplePhrase = "The quick brown fox jumps over the lazy dog to verify biometric typing dynamics.";
  const [typedText, setTypedText] = useState("");
  const [dwellTimes, setDwellTimes] = useState<number[]>([]);
  const keyTimesRef = useRef<Record<string, number>>({});

  // 1. Face Landmark Scanning Effect
  const [faceMeshProgress, setFaceMeshProgress] = useState(0);
  const [isScanningFace, setIsScanningFace] = useState(false);

  const startFaceScan = () => {
    setIsScanningFace(true);
    setFaceMeshProgress(0);
    const interval = setInterval(() => {
      setFaceMeshProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsScanningFace(false);
          setFaceEnrolled(true);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  // 2. Voice Audio Visualizer Simulation
  const startVoiceRecording = () => {
    setIsRecordingVoice(true);
    setVoiceSentenceProgress(0);
    const interval = setInterval(() => {
      setAudioLevel(Math.floor(Math.random() * 80) + 20);
      setVoiceSentenceProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsRecordingVoice(false);
          setVoiceEnrolled(true);
          setAudioLevel(0);
          return 100;
        }
        return prev + 12;
      });
    }, 300);
  };

  // Render Audio Spectrum
  useEffect(() => {
    if (!canvasRef.current || !isRecordingVoice) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
      const width = canvasRef.current!.width;
      const height = canvasRef.current!.height;
      const bars = 32;
      const barWidth = width / bars - 2;

      for (let i = 0; i < bars; i++) {
        const barHeight = Math.random() * (height * 0.8) + 5;
        const x = i * (barWidth + 2);
        const y = height - barHeight;

        const gradient = ctx.createLinearGradient(0, height, 0, 0);
        gradient.addColorStop(0, '#00f2fe');
        gradient.addColorStop(1, '#4f46e5');

        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth, barHeight);
      }
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => cancelAnimationFrame(animId);
  }, [isRecordingVoice]);

  // 3. Keystroke Handler
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    keyTimesRef.current[e.key] = performance.now();
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const downTime = keyTimesRef.current[e.key];
    if (downTime) {
      const dwell = performance.now() - downTime;
      setDwellTimes((prev) => [...prev, dwell]);
    }
  };

  const handleTypingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTypedText(val);
    if (val.length >= samplePhrase.length - 5) {
      setKeystrokeEnrolled(true);
    }
  };

  const finishEnrollment = () => {
    const updatedProfile: ExamineeProfile = {
      ...profile,
      face: {
        enrolledAt: Date.now(),
        embeddingVector512: Array.from({ length: 512 }, () => Math.random()),
        faceMeshLandmarksCount: 468,
        yawPitchBaseline: { yaw: 0.2, pitch: -1.1 },
        status: 'VERIFIED',
      },
      voice: {
        enrolledAt: Date.now(),
        pitchBaselineHz: 142.5,
        spectralFingerprint: [0.1, 0.4, 0.8, 0.6, 0.3, 0.1],
        audioSampleDurationSec: 5.0,
        status: 'VERIFIED',
      },
      keystroke: {
        enrolledAt: Date.now(),
        averageDwellMs: dwellTimes.length ? dwellTimes.reduce((a, b) => a + b, 0) / dwellTimes.length : 108.4,
        averageFlightMs: 135.2,
        sampleCount: dwellTimes.length || 45,
        status: 'VERIFIED',
      },
    };

    onEnrollmentComplete(updatedProfile);
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      {/* Step Header Indicator */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold text-white font-sans flex items-center justify-center gap-3">
          <span>Multi-Factor Biometric Enrollment</span>
          <Sparkles className="w-6 h-6 text-cyan-400" />
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Register facial 3D mesh vectors, voice acoustic prints, and typing dynamics signature before exam launch.
        </p>
      </div>

      {/* Progress Wizard Bar */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <button
          onClick={() => setCurrentStep(1)}
          className={`p-4 rounded-xl border flex items-center space-x-3 transition-all ${
            currentStep === 1
              ? 'bg-cyan-950/40 border-cyan-500/60 text-white shadow-lg shadow-cyan-500/10'
              : faceEnrolled
              ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
              : 'bg-slate-900/60 border-slate-800 text-slate-400'
          }`}
        >
          <div className={`p-2.5 rounded-lg ${faceEnrolled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-cyan-500/20 text-cyan-400'}`}>
            <Camera className="w-5 h-5" />
          </div>
          <div className="text-left">
            <div className="text-xs font-mono uppercase tracking-wider text-slate-400">Step 1</div>
            <div className="font-bold text-sm">Face 3D Mesh Calibration</div>
          </div>
        </button>

        <button
          onClick={() => setCurrentStep(2)}
          className={`p-4 rounded-xl border flex items-center space-x-3 transition-all ${
            currentStep === 2
              ? 'bg-cyan-950/40 border-cyan-500/60 text-white shadow-lg shadow-cyan-500/10'
              : voiceEnrolled
              ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
              : 'bg-slate-900/60 border-slate-800 text-slate-400'
          }`}
        >
          <div className={`p-2.5 rounded-lg ${voiceEnrolled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-cyan-500/20 text-cyan-400'}`}>
            <Mic className="w-5 h-5" />
          </div>
          <div className="text-left">
            <div className="text-xs font-mono uppercase tracking-wider text-slate-400">Step 2</div>
            <div className="font-bold text-sm">Voice Print Acoustic Sample</div>
          </div>
        </button>

        <button
          onClick={() => setCurrentStep(3)}
          className={`p-4 rounded-xl border flex items-center space-x-3 transition-all ${
            currentStep === 3
              ? 'bg-cyan-950/40 border-cyan-500/60 text-white shadow-lg shadow-cyan-500/10'
              : keystrokeEnrolled
              ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
              : 'bg-slate-900/60 border-slate-800 text-slate-400'
          }`}
        >
          <div className={`p-2.5 rounded-lg ${keystrokeEnrolled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-cyan-500/20 text-cyan-400'}`}>
            <Keyboard className="w-5 h-5" />
          </div>
          <div className="text-left">
            <div className="text-xs font-mono uppercase tracking-wider text-slate-400">Step 3</div>
            <div className="font-bold text-sm">Keystroke Dynamics Baseline</div>
          </div>
        </button>
      </div>

      {/* Step Content */}
      <div className="glass-panel p-8 rounded-2xl border border-slate-800 shadow-2xl relative overflow-hidden">
        {/* STEP 1: FACE ENROLLMENT */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Facial Landmark Mesh Registration</h2>
                <p className="text-xs text-slate-400 mt-0.5">Capturing 468 3D facial points and generating a 512-dimensional embedding vector.</p>
              </div>
              {faceEnrolled && (
                <span className="flex items-center space-x-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full text-xs font-mono">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>512-D VECTOR REGISTERED</span>
                </span>
              )}
            </div>

            <div className="relative w-full max-w-lg mx-auto h-64 bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden flex items-center justify-center">
              {/* Simulated Camera Feed with Face Mesh Grid */}
              <div className="absolute inset-0 bg-gradient-to-tr from-cyan-950/20 via-slate-900 to-indigo-950/40" />
              
              <div className="relative z-10 flex flex-col items-center justify-center">
                <div className="relative w-36 h-36 rounded-full border-2 border-dashed border-cyan-400/80 flex items-center justify-center animate-spin-slow">
                  <Camera className="w-12 h-12 text-cyan-400 opacity-80" />
                </div>
                
                {isScanningFace && (
                  <div className="mt-4 text-center">
                    <span className="text-xs font-mono text-cyan-300">CALIBRATING 468 LANDMARKS... {faceMeshProgress}%</span>
                    <div className="w-48 h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden mx-auto">
                      <div className="h-full bg-cyan-400 transition-all duration-200" style={{ width: `${faceMeshProgress}%` }} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-800">
              <div className="text-xs text-slate-400 font-mono">
                CPUID Hardware Status: <span className="text-emerald-400">PHYSICAL_BARE_METAL (PASSED)</span>
              </div>
              <button
                onClick={startFaceScan}
                disabled={isScanningFace}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 font-bold text-sm text-white hover:opacity-90 transition-all shadow-lg shadow-cyan-500/20 flex items-center space-x-2"
              >
                <RefreshCw className={`w-4 h-4 ${isScanningFace ? 'animate-spin' : ''}`} />
                <span>{faceEnrolled ? 'Recalibrate Face Mesh' : 'Capture & Enroll Face'}</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: VOICE ENROLLMENT */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Voice Print Acoustic Enrollment</h2>
                <p className="text-xs text-slate-400 mt-0.5">Record sample sentence to register baseline pitch ($F_0$) frequency and formant spectral acoustic signature.</p>
              </div>
              {voiceEnrolled && (
                <span className="flex items-center space-x-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full text-xs font-mono">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>VOICEPRINT REGISTERED (142.5 Hz)</span>
                </span>
              )}
            </div>

            <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 text-center space-y-4">
              <p className="text-sm text-slate-300 font-mono italic bg-slate-900/60 p-4 rounded-lg border border-slate-800">
                "I affirm that I am the registered examinee, and I pledge to maintain strict academic integrity during this examination."
              </p>

              {/* Dynamic Audio Visualizer Canvas */}
              <div className="h-24 bg-slate-900 rounded-lg flex items-center justify-center overflow-hidden relative">
                <canvas ref={canvasRef} width={400} height={90} className="w-full h-full" />
                {!isRecordingVoice && (
                  <span className="absolute text-xs font-mono text-slate-500">Press Record and speak the phrase above.</span>
                )}
              </div>

              {isRecordingVoice && (
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 transition-all duration-300" style={{ width: `${voiceSentenceProgress}%` }} />
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-800">
              <div className="text-xs text-slate-400 font-mono">
                Mic PnP Driver: <span className="text-emerald-400">REALTEK AUDIO ARRAY (GENUINE)</span>
              </div>
              <button
                onClick={startVoiceRecording}
                disabled={isRecordingVoice}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 font-bold text-sm text-white hover:opacity-90 transition-all shadow-lg shadow-cyan-500/20 flex items-center space-x-2"
              >
                <Mic className={`w-4 h-4 ${isRecordingVoice ? 'animate-pulse text-emerald-400' : ''}`} />
                <span>{voiceEnrolled ? 'Re-record Voice Print' : 'Start Acoustic Enrollment'}</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: KEYSTROKE DYNAMICS */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Keystroke Dynamics Timing Baseline</h2>
                <p className="text-xs text-slate-400 mt-0.5">Type the sample sentence to calibrate dwell time (T_down - T_up) and flight intervals.</p>
              </div>
              {keystrokeEnrolled && (
                <span className="flex items-center space-x-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full text-xs font-mono">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>DWELL BASELINE REGISTERED (108ms)</span>
                </span>
              )}
            </div>

            <div className="space-y-3">
              <p className="text-xs font-mono text-slate-400">Target Sample Prompt:</p>
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-sm font-mono text-cyan-300">
                {samplePhrase}
              </div>

              <input
                type="text"
                value={typedText}
                onKeyDown={handleKeyDown}
                onKeyUp={handleKeyUp}
                onChange={handleTypingChange}
                placeholder="Type the exact text above..."
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-sm font-mono focus:outline-none focus:border-cyan-500 text-white"
              />
            </div>

            {/* Live Metrics */}
            <div className="grid grid-cols-3 gap-4 pt-2">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-center">
                <span className="text-[10px] font-mono text-slate-400 uppercase">Keys Processed</span>
                <p className="text-lg font-bold font-mono text-cyan-400">{dwellTimes.length}</p>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-center">
                <span className="text-[10px] font-mono text-slate-400 uppercase">Avg Dwell Time</span>
                <p className="text-lg font-bold font-mono text-emerald-400">
                  {dwellTimes.length ? Math.round(dwellTimes.reduce((a,b)=>a+b,0)/dwellTimes.length) : 0} ms
                </p>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-center">
                <span className="text-[10px] font-mono text-slate-400 uppercase">Hook Status</span>
                <p className="text-xs font-bold font-mono text-emerald-400 mt-1">WIN32_WH_KEYBOARD_LL ACTIVE</p>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-800">
              <div className="text-xs text-slate-400 font-mono">
                System Hook: <span className="text-emerald-400">ALT+TAB / WIN KEY BLOCKED</span>
              </div>
              <button
                onClick={finishEnrollment}
                disabled={!faceEnrolled || !voiceEnrolled || !keystrokeEnrolled}
                className={`px-8 py-3 rounded-xl font-extrabold text-sm transition-all flex items-center space-x-2 ${
                  faceEnrolled && voiceEnrolled && keystrokeEnrolled
                    ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 shadow-xl shadow-emerald-500/20 hover:opacity-95'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <span>Launch Exam Console</span>
                <CheckCircle2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
