
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ActivityIndicator } from 'react-native';

interface CameraProps {
  onCapture: (image: string) => void;
  onCancel: () => void;
}

const Camera: React.FC<CameraProps> = ({ onCapture, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("Your browser does not support camera access.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: { ideal: 'environment' }, 
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Guidelines: Use explicit play call to ensure it works on mobile devices
        try {
          await videoRef.current.play();
        } catch (playError) {
          console.warn("Auto-play was prevented by the browser.", playError);
        }
      }
    } catch (err: any) {
      console.error("Camera error:", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError("Camera permission denied. Please enable camera access in your browser settings.");
      } else {
        setError("Unable to initialize camera. Please try refreshing.");
      }
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [startCamera]);

  const capture = () => {
    if (!videoRef.current || !canvasRef.current || !isReady) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    // Capture at video native resolution for high quality
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      onCapture(dataUrl);
    }
  };

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <i className="fas fa-camera-slash" style={{ fontSize: 48, color: '#ef4444', marginBottom: 20 }}></i>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={onCancel} style={styles.btnBack}>
          <Text style={styles.btnBackText}>RETURN TO HOME</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.videoWrapper}>
        <video 
          ref={videoRef as any} 
          autoPlay 
          playsInline 
          muted
          onLoadedMetadata={() => setIsReady(true)}
          style={styles.htmlVideo}
        />
      </View>
      <canvas ref={canvasRef as any} style={{ display: 'none' }} />
      
      <View style={styles.uiOverlay}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel} style={styles.closeBtn}>
             <i className="fas fa-times" style={{ color: 'white', fontSize: 20 }}></i>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          {!isReady && (
            <View style={styles.loadingBanner}>
              <ActivityIndicator color="#d4af37" size="small" />
              <Text style={styles.loadingText}>CALIBRATING OPTICS...</Text>
            </View>
          )}
          
          <TouchableOpacity 
            onPress={capture}
            disabled={!isReady}
            style={[styles.shutter, !isReady && { opacity: 0.3 }]}
          >
            <View style={styles.shutterInner} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    width: '100%',
    height: '100%',
  },
  videoWrapper: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  htmlVideo: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  uiOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    padding: 24,
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    marginTop: 20,
  },
  footer: {
    alignItems: 'center',
    marginBottom: 50,
    gap: 24,
  },
  loadingBanner: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.3)',
  },
  loadingText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    marginLeft: 10,
  },
  closeBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  shutter: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 5,
    borderColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  shutterInner: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
    backgroundColor: 'white',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#0f1115',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 32,
    fontSize: 16,
    lineHeight: 24,
  },
  btnBack: {
    backgroundColor: '#d4af37',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
  },
  btnBackText: {
    color: '#0f1115',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 1,
  }
});

export default Camera;
