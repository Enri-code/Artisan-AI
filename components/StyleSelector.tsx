
import React from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { ArtStyle } from '../types';
import { ART_STYLES } from '../constants';

interface StyleSelectorProps {
  selectedStyleId: string | null;
  onSelect: (style: ArtStyle) => void;
}

const StyleSelector: React.FC<StyleSelectorProps> = ({ selectedStyleId, onSelect }) => {
  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {ART_STYLES.map((style) => (
        <TouchableOpacity
          key={style.id}
          onPress={() => onSelect(style)}
          activeOpacity={0.8}
          style={[
            styles.styleCard,
            selectedStyleId === style.id && styles.styleCardActive
          ]}
        >
          <View style={styles.imageWrapper}>
            <Image source={{ uri: style.previewUrl }} style={styles.previewImage} />
            {selectedStyleId === style.id && (
              <View style={styles.activeIndicator}>
                 <i className="fas fa-check" style={{ color: '#0f1115', fontSize: 10 }}></i>
              </View>
            )}
          </View>
          <Text style={[
            styles.styleName,
            selectedStyleId === style.id && styles.styleNameActive
          ]}>{style.name.toUpperCase()}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingLeft: 4,
    paddingRight: 20,
    paddingBottom: 8,
  },
  styleCard: {
    width: 100,
    marginHorizontal: 8,
    alignItems: 'center',
  },
  styleCardActive: {
    transform: [{ scale: 1.05 }],
  },
  imageWrapper: {
    width: 90,
    height: 120,
    borderRadius: 12,
    backgroundColor: '#333',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    opacity: 0.7,
  },
  styleName: {
    color: '#64748b',
    fontSize: 9,
    fontWeight: '800',
    marginTop: 10,
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  styleNameActive: {
    color: '#d4af37',
  },
  activeIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#d4af37',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#13151b',
  }
});

export default StyleSelector;
