
import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView, 
  FlatList, 
  ActivityIndicator,
  Dimensions,
  Alert
} from 'react-native';
import { AppState, View as AppView, ArtStyle, GalleryItem } from './types';
import { ART_STYLES } from './constants';
import { generateArt } from './services/geminiService';
import Camera from './components/Camera';
import StyleSelector from './components/StyleSelector';

const STORAGE_KEY = 'artisan_gallery_v2';
const { width } = Dimensions.get('window');

const App: React.FC = () => {
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

  // Load and Save to storage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setState(prev => ({ ...prev, gallery: JSON.parse(saved) }));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.gallery));
  }, [state.gallery]);

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
    } catch (err) {
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
    Alert.alert("Success", "Saved to Gallery!");
  };

  const renderHome = () => (
    <View style={styles.screen}>
      <View style={styles.heroSection}>
        <Text style={styles.title}>ARTISAN AI</Text>
        <Text style={styles.subtitle}>Elegance in every pixel.</Text>
      </View>
      <View style={styles.heroCard}>
        <Image source={{ uri: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=800' }} style={styles.heroImage} />
        <View style={styles.heroOverlay}>
          <Text style={styles.heroTag}>CURATED COLLECTION</Text>
          <Text style={styles.heroTitle}>The Modern Museum</Text>
        </View>
      </View>
      <View style={styles.actionSection}>
        <TouchableOpacity style={styles.primaryButton} onPress={() => setView('camera')}>
          <i className="fas fa-camera" style={{ color: '#1a1a1a', marginRight: 10 }}></i>
          <Text style={styles.primaryButtonText}>TAKE PHOTO</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => setView('gallery')}>
          <i className="fas fa-palette" style={{ color: '#d4af37', marginRight: 10 }}></i>
          <Text style={styles.secondaryButtonText}>MUSEUM GALLERY ({state.gallery.length})</Text>
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
        <Text style={styles.headerTitle}>MY GALLERY</Text>
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
            <i className="fas fa-image" style={{ fontSize: 48, color: '#333', marginBottom: 10 }}></i>
            <Text style={{ color: '#666' }}>No pieces in your collection.</Text>
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
            <Text style={styles.loaderText}>CRAFTING ART...</Text>
          </View>
        )}
      </View>
      <View style={styles.controls}>
        <Text style={styles.sectionLabel}>CHOOSE ART STYLE</Text>
        <StyleSelector 
          selectedStyleId={state.selectedStyle?.id || null} 
          onSelect={(style) => setState(prev => ({ ...prev, selectedStyle: style }))}
        />
        <TouchableOpacity style={styles.generateButton} onPress={handleGenerate} disabled={state.isProcessing}>
          <Text style={styles.primaryButtonText}>START RENDERING</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderResult = () => (
    <View style={[styles.screen, { backgroundColor: 'black' }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setView('editing')} style={styles.headerBtn}>
          <i className="fas fa-redo" style={{ color: 'white' }}></i>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>MASTERPIECE</Text>
        <TouchableOpacity onPress={() => setView('home')} style={styles.headerBtn}>
          <i className="fas fa-home" style={{ color: 'white' }}></i>
        </TouchableOpacity>
      </View>
      <View style={styles.frameWrapper}>
        <View style={styles.museumFrame}>
          <Image source={{ uri: state.processedImage! }} style={styles.framedImage} />
          <View style={styles.plaque}>
            <Text style={styles.plaqueText}>"{state.selectedStyle?.name} Study"</Text>
          </View>
        </View>
      </View>
      <View style={styles.resultActions}>
        <TouchableOpacity style={styles.saveAction} onPress={saveToGallery}>
          <Text style={styles.saveActionText}>SAVE TO COLLECTION</Text>
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
            <Text style={styles.headerTitle}>DETAILS</Text>
            <TouchableOpacity 
              onPress={() => {
                setState(prev => ({ ...prev, gallery: prev.gallery.filter(i => i.id !== state.selectedGalleryItem!.id), view: 'gallery' }));
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
  screen: {
    flex: 1,
    paddingTop: 10,
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
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  heroSection: {
    padding: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'Playfair Display',
  },
  subtitle: {
    color: '#666',
    marginTop: 8,
  },
  heroCard: {
    width: width - 60,
    alignSelf: 'center',
    aspectRatio: 4/5,
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.3)',
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
    backgroundColor: 'rgba(15,17,21,0.7)',
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
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#1a1a1a',
    fontWeight: 'bold',
    fontSize: 14,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.5)',
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
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderText: {
    color: '#d4af37',
    marginTop: 15,
    fontWeight: 'bold',
    letterSpacing: 2,
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
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#222',
  },
  galleryImage: {
    flex: 1,
    resizeMode: 'cover',
  },
  emptyContainer: {
    flex: 1,
    paddingTop: 100,
    alignItems: 'center',
  },
  frameWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  museumFrame: {
    padding: 20,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 10,
    position: 'relative',
    borderWidth: 10,
    borderColor: '#5c4033', // Dark wood color
  },
  framedImage: {
    width: width - 120,
    height: (width - 120) * 1.33,
    resizeMode: 'cover',
  },
  plaque: {
    position: 'absolute',
    bottom: -15,
    alignSelf: 'center',
    backgroundColor: '#eee',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  plaqueText: {
    fontSize: 10,
    fontStyle: 'italic',
    color: '#333',
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
  },
  detailImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  }
});

export default App;
