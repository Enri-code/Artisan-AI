
import React, { useState, useEffect, useCallback } from 'react';
import { AppState, View, ArtStyle, GalleryItem } from './types';
import { ART_STYLES } from './constants';
import { generateArt } from './services/geminiService';
import Camera from './components/Camera';
import StyleSelector from './components/StyleSelector';

const STORAGE_KEY = 'artisan_gallery_v1';

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

  // Load gallery from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setState(prev => ({ ...prev, gallery: JSON.parse(saved) }));
      } catch (e) {
        console.error("Failed to load gallery", e);
      }
    }
  }, []);

  // Sync gallery to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.gallery));
  }, [state.gallery]);

  const setView = (view: View) => setState(prev => ({ ...prev, view }));

  const handleCapture = (image: string) => {
    setState(prev => ({ ...prev, image, view: 'editing', selectedStyle: ART_STYLES[0] }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setState(prev => ({ 
          ...prev, 
          image: reader.result as string, 
          view: 'editing', 
          selectedStyle: ART_STYLES[0] 
        }));
      };
      reader.readAsDataURL(file);
    }
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
    } catch (err) {
      setState(prev => ({ 
        ...prev, 
        isProcessing: false, 
        error: "Masterpiece creation failed. Please try again later." 
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

    setState(prev => ({
      ...prev,
      gallery: [newItem, ...prev.gallery],
    }));
    
    alert("Saved to your Museum Gallery!");
  };

  const deleteGalleryItem = (id: string) => {
    setState(prev => ({
      ...prev,
      gallery: prev.gallery.filter(item => item.id !== id),
      view: 'gallery'
    }));
  };

  const reEditItem = (item: GalleryItem) => {
    const style = ART_STYLES.find(s => s.id === item.styleId) || ART_STYLES[0];
    setState(prev => ({
      ...prev,
      image: item.originalImage,
      selectedStyle: style,
      view: 'editing'
    }));
  };

  const handleShare = async (imageUrl: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const file = new File([blob], 'artpiece.png', { type: 'image/png' });

      if (navigator.share) {
        await navigator.share({
          files: [file],
          title: 'My Artisan AI Masterpiece',
          text: 'Check out this art I created with Artisan AI!',
        });
      } else {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = 'artisan-masterpiece.png';
        link.click();
      }
    } catch (err) {
      console.error("Sharing failed", err);
    }
  };

  return (
    <div className="min-h-screen max-w-md mx-auto relative flex flex-col bg-[#0f1115] shadow-2xl">
      {/* Home View */}
      {state.view === 'home' && (
        <div className="flex-1 flex flex-col p-8 items-center justify-center text-center space-y-8 animate-fadeIn">
          <div className="space-y-4">
            <h1 className="text-5xl font-bold tracking-tight text-white uppercase">Artisan AI</h1>
            <p className="text-gray-400 text-lg leading-relaxed">
              Transform moments into museum masterpieces.
            </p>
          </div>

          <div className="relative w-full aspect-[4/5] overflow-hidden rounded-3xl gold-border shadow-2xl group">
             <img 
               src="https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=800&auto=format&fit=crop" 
               alt="Hero Art" 
               className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
             />
             <div className="absolute inset-0 bg-gradient-to-t from-[#0f1115] via-transparent to-transparent"></div>
             <div className="absolute bottom-6 left-6 right-6 text-left">
                <span className="text-yellow-500 font-semibold tracking-widest text-xs uppercase">Your Vision</span>
                <h2 className="text-2xl font-bold text-white mt-1">Ready for the Canvas?</h2>
             </div>
          </div>

          <div className="w-full space-y-4 pt-4">
            <button 
              onClick={() => setView('camera')}
              className="w-full py-5 btn-gold rounded-2xl flex items-center justify-center gap-3 shadow-lg"
            >
              <i className="fas fa-camera text-xl"></i>
              <span>START CAPTURE</span>
            </button>
            
            <button 
              onClick={() => setView('gallery')}
              className="w-full py-5 border border-yellow-500/30 bg-yellow-500/5 hover:bg-yellow-500/10 rounded-2xl flex items-center justify-center gap-3 transition-colors text-yellow-500 font-semibold"
            >
              <i className="fas fa-palette text-xl"></i>
              <span>MUSEUM GALLERY ({state.gallery.length})</span>
            </button>

            <label className="w-full py-3 text-gray-400 text-sm flex items-center justify-center gap-2 cursor-pointer hover:text-white transition-colors">
              <i className="fas fa-upload"></i>
              <span>Import from Files</span>
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        </div>
      )}

      {/* Gallery View */}
      {state.view === 'gallery' && (
        <div className="flex-1 flex flex-col p-6 animate-fadeIn">
          <div className="flex items-center justify-between mb-8">
            <button onClick={() => setView('home')} className="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-white">
              <i className="fas fa-arrow-left"></i>
            </button>
            <h2 className="text-xl font-bold text-white uppercase tracking-widest">My Gallery</h2>
            <div className="w-10"></div>
          </div>

          {state.gallery.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40 space-y-4">
              <i className="fas fa-images text-6xl"></i>
              <p className="text-lg">Your art collection is empty</p>
              <button onClick={() => setView('home')} className="text-yellow-500 font-bold underline">Create your first piece</button>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 pb-20">
                {state.gallery.map(item => (
                  <div 
                    key={item.id} 
                    onClick={() => setState(prev => ({ ...prev, selectedGalleryItem: item, view: 'gallery-detail' }))}
                    className="aspect-[3/4] rounded-xl overflow-hidden border border-white/10 relative group active:scale-95 transition-all"
                  >
                    <img src={item.processedImage} className="w-full h-full object-cover" alt="Saved masterpiece" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <i className="fas fa-expand text-white text-2xl"></i>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Gallery Detail View */}
      {state.view === 'gallery-detail' && state.selectedGalleryItem && (
        <div className="flex-1 flex flex-col p-6 animate-fadeIn bg-black">
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => setView('gallery')} className="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-white">
              <i className="fas fa-times"></i>
            </button>
            <h2 className="text-white font-bold uppercase tracking-widest">Art Detail</h2>
            <button 
              onClick={() => deleteGalleryItem(state.selectedGalleryItem!.id)}
              className="text-red-500"
            >
              <i className="fas fa-trash"></i>
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center py-10">
            <div className="relative group">
              <div className="absolute -inset-4 border-[12px] border-yellow-800/60 shadow-2xl pointer-events-none"></div>
              <img 
                src={state.selectedGalleryItem.processedImage} 
                className="max-w-full h-auto shadow-2xl" 
                alt="Detail" 
              />
            </div>
          </div>

          <div className="mt-8 space-y-4">
             <div className="flex gap-4">
               <button 
                 onClick={() => handleShare(state.selectedGalleryItem!.processedImage)}
                 className="flex-1 py-4 bg-white text-black font-bold rounded-2xl flex items-center justify-center gap-2"
               >
                 <i className="fas fa-share-nodes"></i>
                 SHARE
               </button>
               <button 
                 onClick={() => reEditItem(state.selectedGalleryItem!)}
                 className="flex-1 py-4 bg-yellow-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2"
               >
                 <i className="fas fa-wand-magic-sparkles"></i>
                 RE-EDIT
               </button>
             </div>
          </div>
        </div>
      )}

      {/* Camera View */}
      {state.view === 'camera' && (
        <Camera 
          onCapture={handleCapture}
          onCancel={() => setView('home')}
        />
      )}

      {/* Editing View */}
      {state.view === 'editing' && state.image && (
        <div className="flex-1 flex flex-col p-6 animate-fadeIn">
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => setView('home')} className="text-gray-400 hover:text-white">
              <i className="fas fa-arrow-left text-xl"></i>
            </button>
            <h2 className="text-xl font-bold text-white uppercase tracking-widest">Select Style</h2>
            <div className="w-6"></div>
          </div>

          <div className="flex-1 relative mb-6">
             <div className="w-full h-full overflow-hidden rounded-2xl gold-border shadow-xl">
               <img src={state.image} alt="Original" className="w-full h-full object-cover" />
               {state.isProcessing && (
                 <div className="absolute inset-0 glass-panel flex flex-col items-center justify-center space-y-4">
                    <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
                    <div className="text-center">
                      <p className="text-white font-bold text-lg animate-pulse uppercase tracking-widest">Synthesizing Art</p>
                      <p className="text-gray-400 text-sm px-10">Gemini is applying {state.selectedStyle?.name} techniques to your canvas...</p>
                    </div>
                 </div>
               )}
             </div>
          </div>

          {state.error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm flex items-center gap-2">
              <i className="fas fa-exclamation-circle"></i>
              {state.error}
            </div>
          )}

          <div className="space-y-6">
            <div>
               <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-3">CURATED STYLES</p>
               <StyleSelector 
                 selectedStyleId={state.selectedStyle?.id || null} 
                 onSelect={(style) => setState(prev => ({ ...prev, selectedStyle: style }))}
               />
            </div>

            <button 
              onClick={handleGenerate}
              disabled={state.isProcessing}
              className={`w-full py-5 btn-gold rounded-2xl flex items-center justify-center gap-3 shadow-lg ${state.isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <i className="fas fa-paint-brush text-xl"></i>
              <span>CRAFT MASTERPIECE</span>
            </button>
          </div>
        </div>
      )}

      {/* Result View */}
      {state.view === 'result' && state.processedImage && (
        <div className="flex-1 flex flex-col p-6 animate-fadeIn bg-black">
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => setView('editing')} className="text-gray-400 hover:text-white">
              <i className="fas fa-edit text-xl"></i>
            </button>
            <h2 className="text-xl font-bold text-white uppercase tracking-widest">Masterpiece</h2>
            <button onClick={() => setView('home')} className="text-gray-400 hover:text-white">
              <i className="fas fa-home text-xl"></i>
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center">
             <div className="w-full aspect-[3/4] p-4 bg-white shadow-[0_0_50px_rgba(0,0,0,1)] relative">
                <div className="absolute inset-0 border-[16px] border-yellow-800/80 pointer-events-none"></div>
                <div className="absolute inset-2 border-[2px] border-yellow-500/30 pointer-events-none"></div>
                <div className="w-full h-full overflow-hidden shadow-inner">
                  <img src={state.processedImage} alt="Masterpiece" className="w-full h-full object-cover" />
                </div>
                <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-48 bg-gray-200 text-black p-2 text-center shadow-lg border-b-2 border-gray-400">
                   <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">Artisan AI Gallery</p>
                   <p className="text-xs font-serif italic">"{state.selectedStyle?.name} Study, 2024"</p>
                </div>
             </div>
          </div>

          <div className="mt-20 space-y-4">
             <div className="flex gap-4">
               <button 
                 onClick={() => handleShare(state.processedImage!)}
                 className="flex-1 py-4 bg-white text-black font-bold rounded-2xl flex items-center justify-center gap-2"
               >
                 <i className="fas fa-share-nodes"></i>
                 SHARE
               </button>
               <button 
                 onClick={saveToGallery}
                 className="flex-1 py-4 bg-yellow-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(202,138,4,0.4)]"
               >
                 <i className="fas fa-bookmark"></i>
                 SAVE TO MUSEUM
               </button>
             </div>
             
             <div className="flex justify-center gap-6 pt-4 text-gray-400">
               <i className="fab fa-whatsapp text-2xl hover:text-[#25D366] cursor-pointer" onClick={() => handleShare(state.processedImage!)}></i>
               <i className="fab fa-facebook text-2xl hover:text-[#1877F2] cursor-pointer" onClick={() => handleShare(state.processedImage!)}></i>
               <i className="fab fa-snapchat text-2xl hover:text-[#FFFC00] cursor-pointer" onClick={() => handleShare(state.processedImage!)}></i>
               <i className="fab fa-tiktok text-2xl hover:text-white cursor-pointer" onClick={() => handleShare(state.processedImage!)}></i>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
