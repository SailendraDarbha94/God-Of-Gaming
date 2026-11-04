import { amenityLabel } from '@gog/domain';
import { StyleSheet, View } from 'react-native';

import { Chip } from '../../components/Chip';
import { spacing } from '../../lib/theme';

export interface AmenityChipsProps {
  amenities: string[];
}

/** Amenity slugs are free text from the catalog (spec 08); the labels are the domain's, shared with the website. */
export function AmenityChips({ amenities }: AmenityChipsProps) {
  if (amenities.length === 0) {
    return null;
  }
  return (
    <View style={styles.wrap}>
      {amenities.map((amenity) => (
        <Chip key={amenity} label={amenityLabel(amenity)} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
