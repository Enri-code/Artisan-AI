
import React, { useState, useEffect, useCallback } from 'react';
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
  Platform,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { AppState, View as AppView, GalleryItem } from './types';
import { ART_STYLES } from './constants';
import { generateArt } from './services/geminiService';
import Camera from './components/Camera';
import StyleSelector from './components/StyleSelector';

const STORAGE_KEY = 'artisan_gallery_v3';
const { width, height } = Dimensions.get('window');

const App: React.FC = () => {
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [state, setState] = useState<AppState>({
    view: 'home',
    image: null,
    selectedStyle: ART_STYLES[0],
    processedImage: null,
    isProcessing: false,
    error: null,
    gallery: [],
    selectedGalleryItem: null,
  });

  useEffect(() => {
    const initialize = async () => {
      const aistudio = (window as any).aistudio;
      if (aistudio && typeof aistudio.hasSelectedApiKey === 'function') {
        const selected = await aistudio.hasSelectedApiKey();
        setHasKey(selected);
      } else {
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
    setHasKey(true);
  };

  const setView = (view: AppView) => {
    setState(prev => ({ ...prev, view, error: null }));
  };

  const handleCapture = (image: string) => {
    setState(prev => ({ 
      ...prev, 
      image, 
      view: 'editing', 
      error: null 
    }));
  };

  const handleGenerate = async () => {
    if (!state.image || !state.selectedStyle) return;
    
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
    setState(prev => ({ ...prev, gallery: [newItem, ...prev.gallery], view: 'gallery' }));
    Alert.alert("Collection Updated", "Your work is now part of the permanent digital archive.");
  };

  if (hasKey === false) {
    return (
      <SafeAreaView style={styles.authScreen}>
        <View style={styles.authContent}>
          <View style={styles.authIconContainer}>
            <i className="fas fa-key" style={{ fontSize: 32, color: '#d4af37' }}></i>
          </View>
          <Text style={styles.authTitle}>ARTISAN STUDIO</Text>
          <Text style={styles.authText}>
            To access the high-fidelity Gemini 3 Pro rendering engine, a professional API key is required.
          </Text>
          <TouchableOpacity style={styles.authButton} onPress={handleSelectKey}>
            <Text style={styles.authButtonText}>GRANT ACCESS</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const renderHome = () => (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.brandTitle}>ARTISAN</Text>
        <Text style={styles.brandSubtitle}>THE FUTURE OF FINE ART</Text>
      </View>
      
      <View style={styles.heroContainer}>
        <Image 
          source={{ uri: 'https://images.unsplash.com/photo-1579783928621-7a13d66a6211?q=80&w=800' }} 
          style={styles.heroImage} 
        />
        <View style={styles.heroOverlay}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>ULTRA HIGH FIDELITY</Text>
          </View>
          <Text style={styles.heroTitle}>Transform your world into a masterpiece.</Text>
        </View>
      </View>

      <View style={styles.actionGrid}>
        <TouchableOpacity style={styles.mainAction} onPress={() => setView('camera')}>
          <View style={styles.actionIcon}>
             <i className="fas fa-camera" style={{ color: '#1a1a1a', fontSize: 24 }}></i>
          </View>
          <Text style={styles.actionLabel}>CAPTURE NEW WORK</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.secondaryAction} onPress={() => setView('gallery')}>
          <i className="fas fa-th-large" style={{ color: '#d4af37', marginRight: 12 }}></i>
          <Text style={styles.secondaryActionLabel}>MY COLLECTION ({state.gallery.length})</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  const renderEditing = () => (
    <SafeAreaView style={styles.screen}>
      <View style={styles.navbar}>
        <TouchableOpacity onPress={() => setView('home')} style={styles.navButton}>
          <i className="fas fa-arrow-left" style={{ color: 'white' }}></i>
        </TouchableOpacity>
        <Text style={styles.navHeader}>ARTISTIC DIRECTION</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.previewContainer}>
        {state.image && <Image source={{ uri: state.image }} style={styles.previewImage} />}
        
        {state.isProcessing && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#d4af37" />
            <Text style={styles.loadingStep}>PREPARING MASTERPIECE...</Text>
            <Text style={styles.loadingSubtext}>Gemini is mixing virtual pigments</Text>
          </View>
        )}

        {state.error && (
          <View style={styles.errorOverlay}>
            <i className="fas fa-exclamation-circle" style={{ color: '#ef4444', fontSize: 32, marginBottom: 12 }}></i>
            <Text style={styles.errorText}>{state.error}</Text>
            <TouchableOpacity onPress={handleGenerate} style={styles.retryButton}>
              <Text style={styles.retryText}>TRY AGAIN</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.controlsSection}>
        <Text style={styles.sectionLabel}>CHOOSE STYLE</Text>
        <StyleSelector 
          selectedStyleId={state.selectedStyle?.id || null} 
          onSelect={(style) => setState(prev => ({ ...prev, selectedStyle: style }))}
        />
        <TouchableOpacity 
          style={[styles.generateButton, state.isProcessing && { opacity: 0.5 }]} 
          onPress={handleGenerate}
          disabled={state.isProcessing}
        >
          <Text style={styles.generateButtonText}>RENDER WITH GEMINI 3 PRO</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  const renderResult = () => (
    <SafeAreaView style={[styles.screen, { backgroundColor: '#0a0a0c' }]}>
      <View style={styles.navbar}>
        <TouchableOpacity onPress={() => setView('editing')} style={styles.navButton}>
          <i className="fas fa-palette" style={{ color: 'white' }}></i>
        </TouchableOpacity>
        <Text style={styles.navHeader}>EXHIBITION VIEW</Text>
        <TouchableOpacity onPress={() => setView('home')} style={styles.navButton}>
          <i className="fas fa-home" style={{ color: 'white' }}></i>
        </TouchableOpacity>
      </View>

      <View style={styles.exhibitionArea}>
        <View style={styles.premiumFrame}>
          {state.processedImage && <Image source={{ uri: state.processedImage }} style={styles.finalMasterpiece} />}
        </View>
        
        <View style={styles.galleryPlaque}>
          <Text style={styles.plaqueTitle}>{state.selectedStyle?.name}</Text>
          <Text style={styles.plaqueMeta}>Artisan AI • Digital Media • 2024</Text>
          <View style={styles.plaqueDivider} />
          <Text style={styles.plaqueDesc}>Generated using Gemini 3 Pro neural rendering at 1K resolution.</Text>
        </View>
      </View>

      <View style={styles.exhibitionActions}>
        <TouchableOpacity style={styles.saveBtn} onPress={saveToGallery}>
          <Text style={styles.saveBtnText}>ACQUIRE FOR ARCHIVE</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  return (
    <View style={styles.root}>
      {state.view === 'home' && renderHome()}
      {state.view === 'camera' && <Camera onCapture={handleCapture} onCancel={() => setView('home')} />}
      {state.view === 'editing' && renderEditing()}
      {state.view === 'result' && renderResult()}
      {state.view === 'gallery' && (
        <SafeAreaView style={styles.screen}>
          <View style={styles.navbar}>
            <TouchableOpacity onPress={() => setView('home')} style={styles.navButton}>
              <i className="fas fa-chevron-left" style={{ color: 'white' }}></i>
            </TouchableOpacity>
            <Text style={styles.navHeader}>PRIVATE ARCHIVE</Text>
            <View style={{ width: 44 }} />
          </View>
          <FlatList
            data={state.gallery}
            numColumns={2}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.galleryList}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.archiveCard}
                onPress={() => setState(prev => ({ ...prev, selectedGalleryItem: item, view: 'gallery-detail' }))}
              >
                <Image source={{ uri: item.processedImage }} style={styles.archiveThumb} />
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyArchive}>
                <i className="fas fa-feather" style={{ fontSize: 40, color: '#333', marginBottom: 20 }}></i>
                <Text style={styles.emptyArchiveText}>Your archive is currently empty.</Text>
              </View>
            }
          />
        </SafeAreaView>
      )}
      {state.view === 'gallery-detail' && state.selectedGalleryItem && (
        <SafeAreaView style={styles.screen}>
          <View style={styles.navbar}>
            <TouchableOpacity onPress={() => setView('gallery')} style={styles.navButton}>
              <i className="fas fa-chevron-left" style={{ color: 'white' }}></i>
            </TouchableOpacity>
            <Text style={styles.navHeader}>STUDY VIEW</Text>
            <TouchableOpacity 
              onPress={() => {
                setState(prev => ({ 
                  ...prev, 
                  gallery: prev.gallery.filter(i => i.id !== state.selectedGalleryItem!.id), 
                  view: 'gallery' 
                }));
              }}
              style={styles.navButton}
            >
              <i className="fas fa-trash" style={{ color: '#ef4444' }}></i>
            </TouchableOpacity>
          </View>
          <View style={styles.archiveDetailContainer}>
            <Image 
              source={{ uri: state.selectedGalleryItem.processedImage }} 
              style={styles.archiveDetailImage} 
              resizeMode="contain" 
            />
          </View>
        </SafeAreaView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0f1115',
  },
  screen: {
    flex: 1,
  },
  // Auth
  authScreen: {
    flex: 1,
    backgroundColor: '#0f1115',
    justifyContent: 'center',
    padding: 40,
  },
  authContent: {
    alignItems: 'center',
  },
  authIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(212,175,55,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.2)',
  },
  authTitle: {
    fontSize: 28,
    color: 'white',
    fontFamily: 'Playfair Display',
    letterSpacing: 8,
    marginBottom: 16,
    textAlign: 'center',
  },
  authText: {
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    fontSize: 16,
    fontFamily: 'Inter',
  },
  authButton: {
    backgroundColor: '#d4af37',
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  authButtonText: {
    color: '#0f1115',
    fontWeight: '800',
    letterSpacing: 2,
    fontSize: 14,
  },
  // Home
  header: {
    paddingTop: 40,
    paddingBottom: 20,
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 36,
    color: 'white',
    fontFamily: 'Playfair Display',
    fontWeight: '700',
    letterSpacing: 10,
  },
  brandSubtitle: {
    fontSize: 10,
    color: '#d4af37',
    fontWeight: '800',
    letterSpacing: 4,
    marginTop: 8,
  },
  heroContainer: {
    marginHorizontal: 20,
    height: height * 0.45,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: '#1a1d23',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    opacity: 0.8,
  },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 32,
    backgroundColor: 'rgba(15,17,21,0.7)',
  },
  badge: {
    backgroundColor: '#d4af37',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginBottom: 16,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#0f1115',
    letterSpacing: 1,
  },
  heroTitle: {
    fontSize: 28,
    color: 'white',
    fontFamily: 'Playfair Display',
    lineHeight: 34,
  },
  actionGrid: {
    padding: 24,
    gap: 16,
  },
  mainAction: {
    backgroundColor: '#d4af37',
    height: 72,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionLabel: {
    color: '#1a1a1a',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
  secondaryAction: {
    height: 64,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(212,175,55,0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(212,175,55,0.05)',
  },
  secondaryActionLabel: {
    color: '#d4af37',
    fontSize: 14,
    fontWeight: '700',
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
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  navHeader: {
    color: 'white',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 3,
  },
  // Editing
  previewContainer: {
    flex: 1,
    margin: 20,
    borderRadius: 24,
    backgroundColor: '#1a1d23',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,17,21,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingStep: {
    color: '#d4af37',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 24,
    letterSpacing: 3,
  },
  loadingSubtext: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 8,
  },
  controlsSection: {
    padding: 24,
    backgroundColor: '#13151b',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  sectionLabel: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 20,
    marginLeft: 4,
  },
  generateButton: {
    backgroundColor: '#d4af37',
    height: 64,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#d4af37',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  generateButtonText: {
    color: '#0f1115',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 1.5,
  },
  // Exhibition
  exhibitionArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  premiumFrame: {
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderWidth: 12,
    borderColor: '#21160e',
    shadowColor: '#000',
    shadowOpacity: 0.9,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 30 },
  },
  finalMasterpiece: {
    width: width - 88,
    height: (width - 88) * 1.33,
    backgroundColor: '#000',
  },
  galleryPlaque: {
    marginTop: 48,
    backgroundColor: '#e2e8f0',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderWidth: 1,
    borderColor: '#94a3b8',
    alignItems: 'center',
    width: width * 0.7,
  },
  plaqueTitle: {
    fontSize: 20,
    fontFamily: 'Playfair Display',
    fontWeight: '700',
    color: '#1e293b',
  },
  plaqueMeta: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '600',
    letterSpacing: 1,
  },
  plaqueDivider: {
    height: 1,
    backgroundColor: '#cbd5e1',
    width: '40%',
    marginVertical: 10,
  },
  plaqueDesc: {
    fontSize: 8,
    color: '#94a3b8',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  exhibitionActions: {
    padding: 24,
  },
  saveBtn: {
    backgroundColor: '#d4af37',
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#0f1115',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 1,
  },
  // Gallery Grid
  galleryList: {
    padding: 12,
  },
  archiveCard: {
    flex: 0.5,
    aspectRatio: 1,
    margin: 6,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#1a1d23',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  archiveThumb: {
    width: '100%',
    height: '100%',
  },
  emptyArchive: {
    marginTop: 100,
    alignItems: 'center',
  },
  emptyArchiveText: {
    color: '#475569',
    fontSize: 15,
    fontFamily: 'Playfair Display',
  },
  archiveDetailContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  archiveDetailImage: {
    width: '100%',
    height: '100%',
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,17,21,0.98)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    color: '#ef4444',
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#334155',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  retryText: {
    color: 'white',
    fontWeight: '800',
    letterSpacing: 1,
  }
});

export default App;
