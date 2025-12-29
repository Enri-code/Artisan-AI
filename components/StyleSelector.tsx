
import React from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet } from 'react-native-web';
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
      contentContainerStyle={styles.container}
    >
      {ART_STYLES.map((style) => (
        <TouchableOpacity
          key={style.id}
          onPress={() => onSelect(style)}
          activeOpacity={0.7}
          style={[
            styles.item,
            selectedStyleId === style.id && styles.itemSelected
          ]}
        >
          <View style={styles.imageContainer}>
            <Image source={{ uri: style.previewUrl }} style={styles.image} />
            <View style={styles.labelOverlay}>
              <Text style={styles.labelText} numberOfLines={1}>{style.name}</Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  item: {
    width: 110,
    marginHorizontal: 6,
    borderRadius: 12,
    overflow: 'hidden',
    opacity: 0.6,
  },
  itemSelected: {
    opacity: 1,
    transform: [{ scale: 1.05 }],
    borderWidth: 2,
    borderColor: '#d4af37',
  },
  imageContainer: {
    aspectRatio: 3/4,
    backgroundColor: '#333',
  },
  image: {
    flex: 1,
    resizeMode: 'cover',
  },
  labelOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  labelText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  }
});

export default StyleSelector;
