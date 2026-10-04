import React, { useState, useEffect, useRef } from 'react';
import { Camera, CheckCircle2, AlertTriangle, RefreshCw, X, VideoOff, ShieldCheck, Sparkles, User } from 'lucide-react';
import { api } from '../utils/api';

export const FaceEnrollmentModal = ({
  isOpen,
  onClose,
  uid,
  studentName = '',
  onComplete
}) => {
  const [stream, setStream] = useState(null);
  const [cameraState, setCameraState] = useState('idle'); // 'idle' | 'initializing' | 'active' | 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const [errorType, setErrorType] = useState(''); // 'permission' | 'nocamera' | 'server' | 'generic'
  const [isCapturing, setIsCapturing] = useState(false);
  const [photoCount, setPhotoCount] = useState(0);
  const [recentPhotos, setRecentPhotos] = useState([]);
  const [flashEffect, setFlashEffect] = useState(false);
  const [successToast, setSuccessToast] = useState('');

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);

  // Stop camera helper
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.warn('Error stopping camera track:', e);
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStream(null);
  };

  // Start camera helper
  const startCamera = async () => {
    stopCamera();
    setCameraState('initializing');
    setErrorMessage('');
    setErrorType('');

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('CAMERA_UNSUPPORTED');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          facingMode: 'user'
        },
        audio: false
      });

      streamRef.current = mediaStream;
      setStream(mediaStream);
      setCameraState('active');

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch((err) => {
          console.warn('Video play warning:', err);
        });
      }
    } catch (err) {
      console.error('Camera initialization failed:', err);
      setCameraState('error');

      if (
        err.name === 'NotAllowedError' ||
        err.name === 'PermissionDeniedError' ||
        err.message?.includes('Permission denied')
      ) {
        setErrorType('permission');
        setErrorMessage('Camera permission was denied. Please allow camera permissions in your browser address bar.');
      } else if (
        err.name === 'NotFoundError' ||
        err.name === 'DevicesNotFoundError' ||
        err.message === 'CAMERA_UNSUPPORTED'
      ) {
        setErrorType('nocamera');
        setErrorMessage('No camera found on this device. Please connect a webcam or camera device.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setErrorType('hardware');
        setErrorMessage('Camera is currently in use by another application. Please close other camera apps and retry.');
      } else {
        setErrorType('generic');
        setErrorMessage(err.message || 'Unable to access camera. Please check device permissions and retry.');
      }
    }
  };

  // Fetch existing enrolled photos count whenever UID changes and modal opens
  const fetchExistingCount = async () => {
    if (!uid) return;
    try {
      const data = await api.getFacePhotoCount(uid);
      setPhotoCount(data.photoCount || 0);
    } catch (e) {
      console.warn('Failed to fetch existing photo count:', e);
    }
  };

  // Lifecycle on modal open / close
  useEffect(() => {
    if (isOpen && uid) {
      startCamera();
      fetchExistingCount();
      setRecentPhotos([]);
      setSuccessToast('');
    } else {
      stopCamera();
      setCameraState('idle');
      setErrorMessage('');
      setErrorType('');
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, uid]);

  // Ensure stream attaches if video element mounts after stream is active
  useEffect(() => {
    if (cameraState === 'active' && streamRef.current && videoRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
        videoRef.current.play().catch(() => {});
      }
    }
  }, [cameraState]);

  // Capture photo from live video preview
  const handleCapture = async () => {
    if (!videoRef.current || cameraState !== 'active' || isCapturing) return;

    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      setErrorMessage('Video preview not ready yet. Please wait a moment.');
      return;
    }

    setIsCapturing(true);
    setErrorMessage('');
    setErrorType('');

    // Trigger visual shutter flash
    setFlashEffect(true);
    setTimeout(() => setFlashEffect(false), 200);

    try {
      // Draw frame to canvas at full resolution
      const canvas = canvasRef.current || document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to JPEG format
      const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.92);

      // Send to backend POST /api/face/enroll
      const response = await api.enrollFace(uid, jpegDataUrl);

      if (response && response.success) {
        const newCount = response.photoCount ?? photoCount + 1;
        setPhotoCount(newCount);
        setRecentPhotos((prev) => [jpegDataUrl, ...prev.slice(0, 5)]);

        setSuccessToast(`Photo #${newCount} saved!`);
        setTimeout(() => setSuccessToast(''), 2500);

        if (onComplete) {
          onComplete(newCount);
        }
      } else {
        throw new Error(response?.error || 'Server could not save image');
      }
    } catch (err) {
      console.error('Capture & enrollment error:', err);
      setErrorType('server');
      setErrorMessage(
        err.message || 'Server failure: Failed to save photo to backend. Please check server connection.'
      );
    } finally {
      setIsCapturing(false);
    }
  };

  // Done button handler: stops camera and closes modal
  const handleDone = () => {
    stopCamera();
    onClose();
  };

  if (!isOpen) return null;

  // Guidance status helpers
  const getGuidanceBadge = () => {
    if (photoCount === 0) {
      return {
        text: 'Ask for 5–10 photos • Turn head slightly between shots',
        color: 'bg-amber-500/10 text-amber-300 border-amber-500/30'
      };
    }
    if (photoCount < 5) {
      return {
        text: `${photoCount} saved • Capture ${5 - photoCount} more (front, left, right, up, down)`,
        color: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
      };
    }
    if (photoCount <= 10) {
      return {
        text: `${photoCount} saved • Ideal range reached! Feel free to add more angles`,
        color: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
      };
    }
    return {
      text: `${photoCount} saved • Excellent coverage for DNN face recognition!`,
      color: 'bg-purple-500/10 text-purple-300 border-purple-500/30'
    };
  };

  const guidance = getGuidanceBadge();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      {/* Hidden offscreen canvas for capturing frames */}
      <canvas ref={canvasRef} className="hidden" />

      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800/80 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-lg">
              📷
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Face Enrollment
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                  {uid}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {studentName ? `${studentName} • ` : ''}DNN Face Recognition Training
              </p>
            </div>
          </div>

          <button
            onClick={handleDone}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            title="Close camera"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Status / Guidance Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-2xl bg-slate-800/50 border border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Enrollment Progress:
              </span>
              <span className="text-sm font-bold text-white font-mono bg-slate-900 px-2 py-0.5 rounded-md border border-slate-700">
                {photoCount} / 5–10 photos
              </span>
            </div>

            <div className={`text-xs px-3 py-1 rounded-full border font-medium flex items-center gap-1.5 ${guidance.color}`}>
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>{guidance.text}</span>
            </div>
          </div>

          {/* Success Toast */}
          {successToast && (
            <div className="px-4 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successToast}</span>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs sm:text-sm flex items-start gap-3 animate-fadeIn">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1">
                <div className="font-semibold text-rose-300">
                  {errorType === 'permission' && 'Camera Access Denied'}
                  {errorType === 'nocamera' && 'No Camera Detected'}
                  {errorType === 'server' && 'Server Enrollment Error'}
                  {errorType === 'hardware' && 'Camera Device Busy'}
                  {errorType === 'generic' && 'Camera Error'}
                </div>
                <p className="text-rose-200/90">{errorMessage}</p>
                {(errorType === 'permission' || errorType === 'nocamera' || errorType === 'hardware') && (
                  <button
                    onClick={startCamera}
                    className="mt-2 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-all"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retry Camera Connection</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Video Preview Viewport */}
          <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 aspect-[4/3] sm:aspect-[16/10] flex items-center justify-center shadow-inner">
            {/* Camera Initializing */}
            {cameraState === 'initializing' && (
              <div className="flex flex-col items-center justify-center p-6 text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
                <p className="text-sm font-medium text-slate-300">Requesting camera permissions...</p>
                <p className="text-xs text-slate-500">Please click "Allow" if prompted by your browser</p>
              </div>
            )}

            {/* Camera Error View */}
            {cameraState === 'error' && (
              <div className="flex flex-col items-center justify-center p-6 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                  <VideoOff className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-white">Camera Unavailable</h3>
                <p className="text-xs text-slate-400 max-w-sm">
                  {errorMessage || 'Unable to connect to video feed. Check camera connection.'}
                </p>
                <button
                  onClick={startCamera}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-2 border border-slate-700 transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Try Again</span>
                </button>
              </div>
            )}

            {/* Live Video Feed */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                cameraState === 'active' ? 'opacity-100' : 'opacity-0'
              }`}
            />

            {/* Visual Shutter Flash Effect */}
            {flashEffect && (
              <div className="absolute inset-0 bg-white pointer-events-none transition-opacity duration-200 animate-fadeOut" />
            )}

            {/* Live Stream Overlays */}
            {cameraState === 'active' && (
              <>
                {/* LIVE indicator */}
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700/80 flex items-center gap-2 text-[11px] font-semibold text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 -ml-4"></span>
                  <span>LIVE PREVIEW</span>
                </div>

                {/* Face Alignment Frame Guide */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="relative w-48 h-64 sm:w-56 sm:h-72 border-2 border-indigo-400/40 rounded-[48%] flex items-center justify-center shadow-[0_0_40px_rgba(99,102,241,0.15)]">
                    {/* Reticle Corner Brackets */}
                    <div className="absolute top-2 left-6 w-3 h-3 border-t-2 border-l-2 border-indigo-300"></div>
                    <div className="absolute top-2 right-6 w-3 h-3 border-t-2 border-r-2 border-indigo-300"></div>
                    <div className="absolute bottom-2 left-6 w-3 h-3 border-b-2 border-l-2 border-indigo-300"></div>
                    <div className="absolute bottom-2 right-6 w-3 h-3 border-b-2 border-r-2 border-indigo-300"></div>

                    <div className="text-[11px] font-mono text-indigo-300/80 bg-slate-900/60 px-2.5 py-0.5 rounded-full backdrop-blur-sm">
                      Align Face Here
                    </div>
                  </div>
                </div>

                {/* Head Angle Instruction Tip */}
                <div className="absolute bottom-3 left-3 right-3 text-center pointer-events-none">
                  <div className="inline-block px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-800 text-[11px] text-slate-300">
                    💡 Turn head slightly between shots (front, left, right, tilt up, tilt down)
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Captured Photos Reel */}
          {recentPhotos.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Recent Captures ({recentPhotos.length}):</span>
                <span className="text-[11px] text-slate-500">Saved to {uid}</span>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {recentPhotos.map((photo, idx) => (
                  <div key={idx} className="relative w-14 h-14 rounded-xl overflow-hidden border border-slate-700 bg-slate-800 shrink-0">
                    <img src={photo} alt={`Capture ${idx + 1}`} className="w-full h-full object-cover" />
                    <span className="absolute bottom-0.5 right-0.5 bg-slate-900/90 text-indigo-300 text-[9px] font-mono px-1 rounded">
                      #{photoCount - idx}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800/80 bg-slate-900/95 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-400 flex items-center gap-2 w-full sm:w-auto">
            <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>Folder: <span className="font-mono text-indigo-300 font-bold">{uid}</span></span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {/* Capture Button */}
            <button
              onClick={handleCapture}
              disabled={cameraState !== 'active' || isCapturing}
              className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
                cameraState !== 'active' || isCapturing
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-indigo-600/30 hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              {isCapturing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Saving Photo...</span>
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4" />
                  <span>Capture Photo</span>
                </>
              )}
            </button>

            {/* Done Button */}
            <button
              onClick={handleDone}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold text-sm border border-slate-700 transition-all flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Done</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
