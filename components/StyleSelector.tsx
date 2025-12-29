
import React from 'react';
import { ArtStyle } from '../types';
import { ART_STYLES } from '../constants';

interface StyleSelectorProps {
  selectedStyleId: string | null;
  onSelect: (style: ArtStyle) => void;
}

const StyleSelector: React.FC<StyleSelectorProps> = ({ selectedStyleId, onSelect }) => {
  return (
    <div className="w-full">
      <div className="flex overflow-x-auto pb-4 gap-4 px-2 snap-x">
        {ART_STYLES.map((style) => (
          <button
            key={style.id}
            onClick={() => onSelect(style)}
            className={`flex-shrink-0 w-32 snap-start transition-all duration-300 ${
              selectedStyleId === style.id 
                ? 'scale-105 opacity-100' 
                : 'opacity-60 grayscale hover:grayscale-0 hover:opacity-90'
            }`}
          >
            <div className={`relative rounded-xl overflow-hidden aspect-[3/4] mb-2 ${
              selectedStyleId === style.id ? 'ring-2 ring-yellow-500 ring-offset-2 ring-offset-[#0f1115]' : ''
            }`}>
              <img src={style.previewUrl} alt={style.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-2">
                <span className="text-xs font-semibold text-white truncate w-full">{style.name}</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default StyleSelector;
