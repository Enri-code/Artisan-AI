
import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  ActivityIndicator,
  Dimensions,
  Alert,
  FlatList,
  Platform
} from 'react-native';
import { AppState, View as AppView, GalleryItem } from './types';
import { ART_STYLES } from './constants';
import { generateArt } from './services/geminiService';
import Camera from './components/Camera';
import StyleSelector from './components/StyleSelector';

const STORAGE_KEY = 'artisan_gallery_v2';
const { width, height } = Dimensions.get('window');

const App: React.FC = () => {
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [state, setState] = useState<AppState>({
    view: 'home',
    image: null,
    selectedStyle: null,
    processedImage: null,
    isProcessing: false,
    error: null,
    gallery: [],
    selectedGalleryItem: null,
  });

  // Initialization: Check for key selection and load gallery
  useEffect(() => {
    const initialize = async () => {
      const aistudio = (window as any).aistudio;
      if (aistudio && typeof aistudio.hasSelectedApiKey === 'function') {
        const selected = await aistudio.hasSelectedApiKey();
        setHasKey(selected);
      } else {
        // Fallback or dev mode
        setHasKey(true);
      }

      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setState(prev => ({ ...prev, gallery: parsed }));
        } catch (e) {
          console.error("Gallery load failed", e);
        }
      }
    };
    initialize();
  }, []);

  // Save gallery when it changes
  useEffect(() => {
    if (state.gallery.length >= 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.gallery));
    }
  }, [state.gallery]);

  const handleSelectKey = async () => {
    const aistudio = (window as any).aistudio;
    if (aistudio && typeof aistudio.openSelectKey === 'function') {
      await aistudio.openSelectKey();
    }
    setHasKey(true); // Proceed assuming selection or bypass race condition
  };

  const setView = (view: AppView) => {
    setState(prev => ({ ...prev, view, error: null }));
  };

  const handleCapture = (image: string) => {
    setState(prev => ({ 
      ...prev, 
      image, 
      view: 'editing', 
      selectedStyle: ART_STYLES[0],
      error: null 
    }));
  };

  const handleGenerate = async () => {
    if (!state.image || !state.selectedStyle) return;
    
    // Check key again before high-quality generation
    const aistudio = (window as any).aistudio;
    if (aistudio && typeof aistudio.hasSelectedApiKey === 'function') {
      const keyOk = await aistudio.hasSelectedApiKey();
      if (!keyOk) {
        setHasKey(false);
        return;
      }
    }

    setState(prev => ({ ...prev, isProcessing: true, error: null }));
    try {
      const result = await generateArt(state.image, state.selectedStyle.prompt);
      setState(prev => ({ 
        ...prev, 
        processedImage: result, 
        view: 'result', 
        isProcessing: false 
      }));
    } catch (err: any) {
      console.error("Masterpiece Error:", err);
      if (err.message === "API_KEY_INVALID") {
        setHasKey(false);
      }
      setState(prev => ({ 
        ...prev, 
        isProcessing: false, 
        error: err.message || "The curator encountered a technical difficulty." 
      }));
    }
  };

  const saveToGallery = () => {
    if (!state.processedImage || !state.image || !state.selectedStyle) return;
    const newItem: GalleryItem = {
      id: Date.now().toString(),
      originalImage: state.image,
      processedImage: state.processedImage,
      styleId: state.selectedStyle.id,
      timestamp: Date.now(),
    };
    setState(prev => ({ ...prev, gallery: [newItem, ...prev.gallery] }));
    Alert.alert("Museum Collection", "Your masterpiece has been saved to the permanent collection.");
  };

  if (hasKey === false) {
    return (
      <View style={styles.authScreen}>
        <View style={styles.authContent}>
          <View style={styles.authIconContainer}>
            <i className="fas fa-lock" style={{ fontSize: 32, color: '#d4af37' }}></i>
          </View>
          <Text style={styles.authTitle}>STUDIO ACCESS</Text>
          <Text style={styles.authText}>
            This application uses Gemini 3 Pro for high-fidelity artistic rendering. A Google Gemini API key from a paid GCP project is required.
          </Text>
          <TouchableOpacity style={styles.authButton} onPress={handleSelectKey}>
            <Text style={styles.authButtonText}>SELECT API KEY</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => window.open('https://ai.google.dev/gemini-api/docs/billing', '_blank')}
            style={styles.billingLink}
          >
            <Text style={styles.billingText}>View Billing Documentation</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (hasKey === null) {
    return (
      <View style={styles.authScreen}>
        <ActivityIndicator size="large" color="#d4af37" />
      </View>
    );
  }

  const renderHome = () => (
    <View style={styles.screen}>
      <View style={styles.heroSection}>
        <Text style={styles.brandTitle}>ARTISAN AI</Text>
        <Text style={styles.brandTagline}>FINE ART GENERATION ENGINE</Text>
      </View>
      
      <View style={styles.mainFeature}>
        <Image 
          source={{ uri: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=800' }} 
          style={styles.featureImage} 
        />
        <View style={styles.featureOverlay}>
          <Text style={styles.featureTag}>GEMINI 3 PRO POWERED</Text>
          <Text style={styles.featureTitle}>Capture Beauty</Text>
        </View>
      </View>

      <View style={styles.homeActions}>
        <TouchableOpacity style={styles.btnPrimary} onPress={() => setView('camera')}>
          <i className="fas fa-camera" style={{ marginRight: 12, color: '#1a1a1a' }}></i>
          <Text style={styles.btnPrimaryText}>START CAPTURE</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.btnSecondary} onPress={() => setView('gallery')}>
          <i className="fas fa-palette" style={{ marginRight: 12, color: '#d4af37' }}></i>
          <Text style={styles.btnSecondaryText}>VIEW MUSEUM ({state.gallery.length})</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEditing = () => (
    <View style={styles.screen}>
      <View style={styles.navbar}>
        <TouchableOpacity onPress={() => setView('home')} style={styles.navIcon}>
          <i className="fas fa-chevron-left" style={{ color: 'white' }}></i>
        </TouchableOpacity>
        <Text style={styles.navTitle}>PREVIEW CANVAS</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.canvasArea}>
        {state.image && <Image source={{ uri: state.image }} style={styles.canvasPreview} />}
        
        {state.isProcessing && (
          <View style={styles.overlayLoading}>
            <ActivityIndicator size="large" color="#d4af37" />
            <Text style={styles.loadingMessage}>MIXING PIGMENTS...</Text>
          </View>
        )}

        {state.error && (
          <View style={styles.overlayError}>
            <i className="fas fa-exclamation-triangle" style={{ color: '#ef4444', fontSize: 24, marginBottom: 10 }}></i>
            <Text style={styles.errorText}>{state.error}</Text>
            <TouchableOpacity onPress={handleGenerate} style={styles.btnRetry}>
              <Text style={styles.btnRetryText}>RETRY</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.editingDrawer}>
        <Text style={styles.drawerLabel}>SELECT ARTISTIC STYLE</Text>
        <StyleSelector 
          selectedStyleId={state.selectedStyle?.id || null} 
          onSelect={(style) => setState(prev => ({ ...prev, selectedStyle: style }))}
        />
        <TouchableOpacity 
          style={[styles.btnGenerate, state.isProcessing && { opacity: 0.5 }]} 
          onPress={handleGenerate}
          disabled={state.isProcessing}
        >
          <Text style={styles.btnGenerateText}>RENDER MASTERPIECE</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderResult = () => (
    <View style={[styles.screen, { backgroundColor: '#000' }]}>
      <View style={styles.navbar}>
        <TouchableOpacity onPress={() => setView('editing')} style={styles.navIcon}>
          <i className="fas fa-paint-brush" style={{ color: 'white' }}></i>
        </TouchableOpacity>
        <Text style={styles.navTitle}>THE MASTERPIECE</Text>
        <TouchableOpacity onPress={() => setView('home')} style={styles.navIcon}>
          <i className="fas fa-home" style={{ color: 'white' }}></i>
        </TouchableOpacity>
      </View>

      <View style={styles.museumDisplay}>
        <View style={styles.ornateFrame}>
          {state.processedImage && <Image source={{ uri: state.processedImage }} style={styles.masterpieceImage} />}
          <View style={styles.frameShadow} />
        </View>
        
        <View style={styles.museumPlaque}>
          <Text style={styles.plaqueStyle}>{state.selectedStyle?.name}</Text>
          <Text style={styles.plaqueArtist}>Artisan AI Studio, 2024</Text>
        </View>
      </View>

      <View style={styles.resultActions}>
        <TouchableOpacity style={styles.btnSave} onPress={saveToGallery}>
          <Text style={styles.btnSaveText}>ADD TO PERMANENT COLLECTION</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderGallery = () => (
    <View style={styles.screen}>
      <View style={styles.navbar}>
        <TouchableOpacity onPress={() => setView('home')} style={styles.navIcon}>
          <i className="fas fa-chevron-left" style={{ color: 'white' }}></i>
        </TouchableOpacity>
        <Text style={styles.navTitle}>MUSEUM ARCHIVE</Text>
        <View style={{ width: 44 }} />
      </View>

      <FlatList
        data={state.gallery}
        numColumns={2}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.galleryGrid}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.galleryCard}
            onPress={() => setState(prev => ({ ...prev, selectedGalleryItem: item, view: 'gallery-detail' }))}
          >
            <Image source={{ uri: item.processedImage }} style={styles.galleryThumb} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyGallery}>
            <i className="fas fa-image" style={{ fontSize: 40, color: '#333', marginBottom: 12 }}></i>
            <Text style={styles.emptyText}>The archives are currently empty.</Text>
          </View>
        }
      />
    </View>
  );

  return (
    <View style={styles.rootContainer}>
      {state.view === 'home' && renderHome()}
      {state.view === 'camera' && <Camera onCapture={handleCapture} onCancel={() => setView('home')} />}
      {state.view === 'editing' && renderEditing()}
      {state.view === 'result' && renderResult()}
      {state.view === 'gallery' && renderGallery()}
      {state.view === 'gallery-detail' && state.selectedGalleryItem && (
        <View style={styles.screen}>
          <View style={styles.navbar}>
            <TouchableOpacity onPress={() => setView('gallery')} style={styles.navIcon}>
              <i className="fas fa-chevron-left" style={{ color: 'white' }}></i>
            </TouchableOpacity>
            <Text style={styles.navTitle}>ARCHIVE VIEW</Text>
            <TouchableOpacity 
              onPress={() => {
                setState(prev => ({ 
                  ...prev, 
                  gallery: prev.gallery.filter(i => i.id !== state.selectedGalleryItem!.id), 
                  view: 'gallery' 
                }));
              }}
              style={styles.navIcon}
            >
              <i className="fas fa-trash-alt" style={{ color: '#ef4444' }}></i>
            </TouchableOpacity>
          </View>
          <View style={styles.detailContainer}>
            <Image 
              source={{ uri: state.selectedGalleryItem.processedImage }} 
              style={styles.detailImage} 
              resizeMode="contain" 
            />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#0f1115',
    width: '100%',
    height: '100%',
  },
  screen: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  // Auth Screen
  authScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#0f1115',
  },
  authContent: {
    alignItems: 'center',
    width: '100%',
  },
  authIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(212,175,55,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.3)',
  },
  authTitle: {
    fontSize: 24,
    color: 'white',
    fontFamily: 'Playfair Display',
    fontWeight: 'bold',
    letterSpacing: 4,
    marginBottom: 16,
  },
  authText: {
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
    fontSize: 14,
  },
  authButton: {
    backgroundColor: '#d4af37',
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
  },
  authButtonText: {
    color: '#0f1115',
    fontWeight: '700',
    letterSpacing: 2,
    fontSize: 14,
  },
  billingLink: {
    marginTop: 20,
    padding: 10,
  },
  billingText: {
    color: '#64748b',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  // Home Screen
  heroSection: {
    paddingTop: 60,
    paddingBottom: 24,
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: 'white',
    fontFamily: 'Playfair Display',
    letterSpacing: 6,
  },
  brandTagline: {
    color: '#d4af37',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 4,
    marginTop: 4,
  },
  mainFeature: {
    marginHorizontal: 20,
    aspectRatio: 1,
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  featureImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  featureOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    backgroundColor: 'rgba(15,17,21,0.85)',
  },
  featureTag: {
    color: '#d4af37',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 4,
  },
  featureTitle: {
    color: 'white',
    fontSize: 26,
    fontWeight: 'bold',
    fontFamily: 'Playfair Display',
  },
  homeActions: {
    padding: 24,
    gap: 16,
  },
  btnPrimary: {
    backgroundColor: '#d4af37',
    height: 64,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnPrimaryText: {
    color: '#1a1a1a',
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 1,
  },
  btnSecondary: {
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.4)',
    height: 64,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(212,175,55,0.05)',
  },
  btnSecondaryText: {
    color: '#d4af37',
    fontWeight: '700',
    fontSize: 14,
  },
  // Navbar
  navbar: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  navIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  navTitle: {
    color: 'white',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
  },
  // Editing Screen
  canvasArea: {
    flex: 1,
    margin: 16,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#1a1d23',
    borderWidth: 1,
    borderColor: '#334155',
  },
  canvasPreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  overlayLoading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,17,21,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingMessage: {
    color: '#d4af37',
    marginTop: 16,
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 2,
  },
  overlayError: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,17,21,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    zIndex: 11,
  },
  errorText: {
    color: '#ef4444',
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 20,
  },
  btnRetry: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#334155',
  },
  btnRetryText: {
    color: 'white',
    fontWeight: 'bold',
  },
  editingDrawer: {
    padding: 24,
    backgroundColor: '#15181e',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  drawerLabel: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 16,
  },
  btnGenerate: {
    backgroundColor: '#d4af37',
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  btnGenerateText: {
    color: '#0f1115',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 1,
  },
  // Result Screen
  museumDisplay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  ornateFrame: {
    padding: 12,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.8,
    shadowRadius: 30,
    borderWidth: 12,
    borderColor: '#2a1a0f',
    elevation: 20,
  },
  masterpieceImage: {
    width: width - 80,
    height: (width - 80) * 1.33,
    backgroundColor: '#111',
  },
  frameShadow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  museumPlaque: {
    marginTop: 40,
    paddingVertical: 8,
    paddingHorizontal: 24,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
  },
  plaqueStyle: {
    fontSize: 16,
    fontFamily: 'Playfair Display',
    fontWeight: 'bold',
    color: '#1e293b',
  },
  plaqueArtist: {
    fontSize: 9,
    color: '#64748b',
    fontStyle: 'italic',
    marginTop: 2,
  },
  resultActions: {
    padding: 30,
  },
  btnSave: {
    backgroundColor: '#d4af37',
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnSaveText: {
    color: '#0f1115',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 1,
  },
  // Gallery
  galleryGrid: {
    padding: 12,
  },
  galleryCard: {
    flex: 0.5,
    aspectRatio: 1,
    margin: 4,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1a1d23',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  galleryThumb: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  emptyGallery: {
    paddingTop: 100,
    alignItems: 'center',
    opacity: 0.5,
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  detailContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  detailImage: {
    width: '100%',
    height: '100%',
  }
});

export default App;
