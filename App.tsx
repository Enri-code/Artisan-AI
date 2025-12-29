
import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  SafeAreaView, 
  ActivityIndicator,
  Dimensions,
  Alert,
  FlatList,
  Linking
} from 'react-native-web';
import { AppState, View as AppView, GalleryItem } from './types';
import { ART_STYLES } from './constants';
import { generateArt } from './services/geminiService';
import Camera from './components/Camera';
import StyleSelector from './components/StyleSelector';

const STORAGE_KEY = 'artisan_gallery_v2';
const { width } = Dimensions.get('window');

const App: React.FC = () => {
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [state, setState] = useState<AppState>({
    view: 'home',
    image: null,
    selectedStyle: null,
    processedImage: null,
    // Fix: Remove the 'boolean =' type annotation/assignment which is invalid in an object literal.
    isProcessing: false,
    error: null,
    gallery: [],
    selectedGalleryItem: null,
  });

  // Check for API key on mount
  useEffect(() => {
    const checkKey = async () => {
      const aistudio = (window as any).aistudio;
      if (aistudio) {
        const selected = await aistudio.hasSelectedApiKey();
        setHasKey(selected);
      } else {
        // Fallback for environments where aistudio is not injected
        setHasKey(true);
      }
    };
    checkKey();

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setState(prev => ({ ...prev, gallery: JSON.parse(saved) }));
      } catch (e) {
        console.error("Load gallery failed", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.gallery));
  }, [state.gallery]);

  const handleSelectKey = async () => {
    const aistudio = (window as any).aistudio;
    if (aistudio) {
      await aistudio.openSelectKey();
    }
    setHasKey(true);
  };

  const setView = (view: AppView) => setState(prev => ({ ...prev, view }));

  const handleCapture = (image: string) => {
    setState(prev => ({ ...prev, image, view: 'editing', selectedStyle: ART_STYLES[0] }));
  };

  const handleGenerate = async () => {
    if (!state.image || !state.selectedStyle) return;
    setState(prev => ({ ...prev, isProcessing: true, error: null }));
    try {
      const result = await generateArt(state.image, state.selectedStyle.prompt);
      setState(prev => ({ ...prev, processedImage: result, view: 'result', isProcessing: false }));
    } catch (err: any) {
      if (err.message === "API_KEY_INVALID") {
        setHasKey(false);
        Alert.alert("Key Required", "Your API key session expired or is invalid. Please select it again.");
      }
      setState(prev => ({ ...prev, isProcessing: false, error: "Masterpiece failed." }));
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
    Alert.alert("Success", "Saved to Museum Collection!");
  };

  if (hasKey === false) {
    return (
      <View style={styles.setupScreen}>
        <View style={styles.setupContent}>
          <i className="fas fa-key" style={{ fontSize: 60, color: '#d4af37', marginBottom: 20 }}></i>
          <Text style={styles.setupTitle}>UNLOCK THE STUDIO</Text>
          <Text style={styles.setupSubtitle}>
            To create high-fidelity AI art with Gemini 3 Pro, you must select your own Google Gemini API key.
          </Text>
          
          <TouchableOpacity style={styles.primaryButton} onPress={handleSelectKey}>
            <Text style={styles.primaryButtonText}>SELECT API KEY</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => window.open('https://ai.google.dev/gemini-api/docs/billing', '_blank')}
            style={styles.billingLink}
          >
            <Text style={styles.billingText}>Learn about API billing & setup</Text>
            <i className="fas fa-external-link-alt" style={{ color: '#666', fontSize: 12, marginLeft: 5 }}></i>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (hasKey === null) {
    return (
      <View style={styles.setupScreen}>
        <ActivityIndicator size="large" color="#d4af37" />
      </View>
    );
  }

  const renderHome = () => (
    <View style={styles.screen}>
      <View style={styles.heroSection}>
        <Text style={styles.title}>ARTISAN AI</Text>
        <Text style={styles.subtitle}>Transforming pixels into fine art.</Text>
      </View>
      <View style={styles.heroCard}>
        <Image source={{ uri: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=800' }} style={styles.heroImage} />
        <View style={styles.heroOverlay}>
          <Text style={styles.heroTag}>GEMINI 3 PRO POWERED</Text>
          <Text style={styles.heroTitle}>The Artist's Eye</Text>
        </View>
      </View>
      <View style={styles.actionSection}>
        <TouchableOpacity style={styles.primaryButton} onPress={() => setView('camera')}>
          <i className="fas fa-camera" style={{ color: '#1a1a1a', marginRight: 10 }}></i>
          <Text style={styles.primaryButtonText}>CAPTURE VISION</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => setView('gallery')}>
          <i className="fas fa-palette" style={{ color: '#d4af37', marginRight: 10 }}></i>
          <Text style={styles.secondaryButtonText}>MY COLLECTION ({state.gallery.length})</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderGallery = () => (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setView('home')} style={styles.headerBtn}>
          <i className="fas fa-arrow-left" style={{ color: 'white' }}></i>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>MUSEUM GALLERY</Text>
        <View style={{ width: 40 }} />
      </View>
      <FlatList
        data={state.gallery}
        numColumns={2}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 10 }}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.galleryItem}
            onPress={() => setState(prev => ({ ...prev, selectedGalleryItem: item, view: 'gallery-detail' }))}
          >
            <Image source={{ uri: item.processedImage }} style={styles.galleryImage} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <i className="fas fa-ghost" style={{ fontSize: 48, color: '#333', marginBottom: 10 }}></i>
            <Text style={{ color: '#666' }}>Your canvas is blank.</Text>
          </View>
        }
      />
    </View>
  );

  const renderEditing = () => (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setView('home')} style={styles.headerBtn}>
          <i className="fas fa-times" style={{ color: 'white' }}></i>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>EDIT CANVAS</Text>
        <View style={{ width: 40 }} />
      </View>
      <View style={styles.previewContainer}>
        <Image source={{ uri: state.image! }} style={styles.mainPreview} />
        {state.isProcessing && (
          <View style={styles.loaderOverlay}>
            <ActivityIndicator size="large" color="#d4af37" />
            <Text style={styles.loaderText}>MIXING COLORS...</Text>
          </View>
        )}
      </View>
      <View style={styles.controls}>
        <Text style={styles.sectionLabel}>APPLY STYLE</Text>
        <StyleSelector 
          selectedStyleId={state.selectedStyle?.id || null} 
          onSelect={(style) => setState(prev => ({ ...prev, selectedStyle: style }))}
        />
        <TouchableOpacity style={styles.generateButton} onPress={handleGenerate} disabled={state.isProcessing}>
          <Text style={styles.primaryButtonText}>RENDER MASTERPIECE</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderResult = () => (
    <View style={[styles.screen, { backgroundColor: 'black' }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setView('editing')} style={styles.headerBtn}>
          <i className="fas fa-paint-roller" style={{ color: 'white' }}></i>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>MUSEUM PIECE</Text>
        <TouchableOpacity onPress={() => setView('home')} style={styles.headerBtn}>
          <i className="fas fa-home" style={{ color: 'white' }}></i>
        </TouchableOpacity>
      </View>
      <View style={styles.frameWrapper}>
        <View style={styles.museumFrame}>
          <Image source={{ uri: state.processedImage! }} style={styles.framedImage} />
          <div style={{ position: 'absolute', bottom: -12, left: 0, right: 0, alignItems: 'center', justifyContent: 'center', display: 'flex' }}>
            <View style={styles.plaque}>
               <Text style={styles.plaqueText}>Artisan AI Study - {state.selectedStyle?.name}</Text>
            </View>
          </div>
        </View>
      </View>
      <View style={styles.resultActions}>
        <TouchableOpacity style={styles.saveAction} onPress={saveToGallery}>
          <Text style={styles.saveActionText}>SAVE TO MY COLLECTION</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {state.view === 'home' && renderHome()}
      {state.view === 'gallery' && renderGallery()}
      {state.view === 'camera' && <Camera onCapture={handleCapture} onCancel={() => setView('home')} />}
      {state.view === 'editing' && renderEditing()}
      {state.view === 'result' && renderResult()}
      {state.view === 'gallery-detail' && state.selectedGalleryItem && (
        <View style={[styles.screen, { backgroundColor: 'black' }]}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setView('gallery')} style={styles.headerBtn}>
              <i className="fas fa-arrow-left" style={{ color: 'white' }}></i>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>VIEWING</Text>
            <TouchableOpacity 
              onPress={() => {
                setState(prev => ({ 
                  ...prev, 
                  gallery: prev.gallery.filter(i => i.id !== state.selectedGalleryItem!.id), 
                  view: 'gallery' 
                }));
              }}
            >
              <i className="fas fa-trash" style={{ color: '#ef4444' }}></i>
            </TouchableOpacity>
          </View>
          <View style={styles.frameWrapper}>
            <Image source={{ uri: state.selectedGalleryItem.processedImage }} style={styles.detailImage} />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f1115',
  },
  setupScreen: {
    flex: 1,
    backgroundColor: '#0f1115',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  setupContent: {
    alignItems: 'center',
    textAlign: 'center',
  },
  setupTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    letterSpacing: 4,
    marginBottom: 15,
    fontFamily: 'Playfair Display',
  },
  setupSubtitle: {
    color: '#999',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  billingLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    opacity: 0.7,
  },
  billingText: {
    color: '#666',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 60,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  headerTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  heroSection: {
    padding: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'Playfair Display',
    letterSpacing: 2,
  },
  subtitle: {
    color: '#666',
    marginTop: 8,
    letterSpacing: 1,
  },
  heroCard: {
    width: width - 60,
    alignSelf: 'center',
    aspectRatio: 4/5,
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.2)',
  },
  heroImage: {
    flex: 1,
    resizeMode: 'cover',
  },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    backgroundColor: 'rgba(15,17,21,0.85)',
  },
  heroTag: {
    color: '#d4af37',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  heroTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 4,
  },
  actionSection: {
    padding: 30,
    gap: 16,
  },
  primaryButton: {
    backgroundColor: '#d4af37',
    paddingVertical: 18,
    paddingHorizontal: 30,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  primaryButtonText: {
    color: '#1a1a1a',
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 1,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.4)',
    paddingVertical: 18,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(212,175,55,0.05)',
  },
  secondaryButtonText: {
    color: '#d4af37',
    fontWeight: 'bold',
    fontSize: 14,
  },
  previewContainer: {
    flex: 1,
    margin: 20,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333',
  },
  mainPreview: {
    flex: 1,
    resizeMode: 'cover',
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderText: {
    color: '#d4af37',
    marginTop: 15,
    fontWeight: 'bold',
    letterSpacing: 2,
    fontSize: 12,
  },
  controls: {
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  sectionLabel: {
    color: '#666',
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 15,
    marginLeft: 10,
    letterSpacing: 1,
  },
  generateButton: {
    backgroundColor: '#d4af37',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  galleryItem: {
    flex: 0.5,
    aspectRatio: 1,
    margin: 5,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#222',
  },
  galleryImage: {
    flex: 1,
    resizeMode: 'cover',
  },
  emptyContainer: {
    flex: 1,
    paddingTop: 100,
    alignItems: 'center',
    opacity: 0.5,
  },
  frameWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  museumFrame: {
    padding: 16,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.6,
    shadowRadius: 40,
    position: 'relative',
    borderWidth: 12,
    borderColor: '#3a2a1f',
  },
  framedImage: {
    width: width - 120,
    height: (width - 120) * 1.33,
    resizeMode: 'cover',
  },
  plaque: {
    backgroundColor: '#ddd',
    paddingHorizontal: 15,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#bbb',
  },
  plaqueText: {
    fontSize: 9,
    fontStyle: 'italic',
    color: '#222',
    fontWeight: '500',
  },
  resultActions: {
    padding: 40,
  },
  saveAction: {
    backgroundColor: '#d4af37',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  saveActionText: {
    color: '#1a1a1a',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  detailImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  }
});

export default App;
