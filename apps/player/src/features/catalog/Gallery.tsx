import type { CafeImage } from '@gog/domain';
import { Image } from 'expo-image';
import { FlatList, StyleSheet, useWindowDimensions, View } from 'react-native';

import { colors, radii, spacing } from '../../lib/theme';

export interface GalleryProps {
  images: CafeImage[];
}

const GALLERY_HEIGHT = 220;

/** A horizontal, paged strip of the cafe's photos; a solid block when it has none yet. */
export function Gallery({ images }: GalleryProps) {
  const { width } = useWindowDimensions();
  const pageWidth = width - spacing.lg * 2;

  if (images.length === 0) {
    return <View style={[styles.fallback, { width: pageWidth }]} />;
  }

  return (
    <FlatList
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      data={images}
      keyExtractor={(image) => image.id}
      snapToInterval={pageWidth + spacing.sm}
      decelerationRate="fast"
      ItemSeparatorComponent={Separator}
      renderItem={({ item }) => (
        <Image
          source={item.url}
          alt={item.alt}
          style={[styles.image, { width: pageWidth }]}
          contentFit="cover"
          transition={200}
        />
      )}
    />
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  image: {
    height: GALLERY_HEIGHT,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceRaised,
  },
  fallback: {
    height: GALLERY_HEIGHT,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceRaised,
  },
  separator: {
    width: spacing.sm,
  },
});
