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
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 } },
        audio: false
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Force play for mobile browsers
        try {
          await videoRef.current.play();
        } catch (playError) {
          console.warn("Auto-play blocked, waiting for interaction", playError);
        }
      }
    } catch (err: any) {
      console.error("Camera error:", err);
      setError("Camera access required. Please check your browser permissions.");
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
    };
  }, [startCamera]);

  const capture = () => {
    if (!videoRef.current || !canvasRef.current || !isReady) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      onCapture(dataUrl);
    }
  };

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <i className="fas fa-exclamation-circle" style={{ fontSize: 40, color: '#ef4444', marginBottom: 20 }}></i>
        <Text style={{ color: 'white', textAlign: 'center', marginBottom: 30 }}>{error}</Text>
        <TouchableOpacity onPress={onCancel} style={styles.btnSmall}>
          <Text style={{ color: '#d4af37', fontWeight: 'bold' }}>GO BACK</Text>
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
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </View>
      <canvas ref={canvasRef as any} style={{ display: 'none' }} />
      
      <View style={styles.uiOverlay}>
        <View style={styles.topRow}>
          <TouchableOpacity onPress={onCancel} style={styles.iconBtn}>
             <i className="fas fa-times" style={{ color: 'white' }}></i>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomRow}>
          {!isReady && (
            <View style={styles.status}>
              <ActivityIndicator color="#d4af37" size="small" />
              <Text style={styles.statusText}>READYING LENS...</Text>
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
  uiOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    padding: 24,
    zIndex: 10,
  },
  topRow: {
    flexDirection: 'row',
    marginTop: 20,
  },
  bottomRow: {
    alignItems: 'center',
    marginBottom: 40,
    gap: 20,
  },
  status: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    marginLeft: 8,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'white',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#0f1115',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  btnSmall: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#222',
    borderRadius: 12,
  }
});

export default Camera;