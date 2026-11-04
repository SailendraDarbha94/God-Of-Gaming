import { STATION_KIND_LABELS, type CafeCard as CafeCardModel } from '@gog/domain';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { Card } from '../../components/Card';
import { Text } from '../../components/Text';
import { formatRatePerHour, formatStations } from '../../lib/format';
import { colors, spacing } from '../../lib/theme';

export interface CafeCardProps {
  cafe: CafeCardModel;
  onPress: () => void;
}

export const CAFE_CARD_COVER_HEIGHT = 160;

export function CafeCard({ cafe, onPress }: CafeCardProps) {
  const kinds = cafe.kinds.map((kind) => STATION_KIND_LABELS[kind]).join(' · ');
  const price =
    cafe.fromHourlyRatePaise === null
      ? 'Prices at the counter'
      : `from ${formatRatePerHour(cafe.fromHourlyRatePaise)}`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${cafe.name}, ${cafe.area.name}, ${price}`}
      onPress={onPress}
      style={({ pressed }) => pressed && styles.pressed}
    >
      <Card flush>
        {cafe.coverImageUrl === null ? (
          <View style={[styles.cover, styles.coverFallback]} />
        ) : (
          <Image
            source={cafe.coverImageUrl}
            alt={cafe.name}
            style={styles.cover}
            contentFit="cover"
            transition={200}
          />
        )}
        <View style={styles.body}>
          <Text variant="subheading">{cafe.name}</Text>
          <Text variant="caption" tone="muted">
            {cafe.area.name}
          </Text>
          {kinds === '' ? null : <Text variant="caption">{kinds}</Text>}
          <View style={styles.footer}>
            <Text>{price}</Text>
            <Text variant="caption" tone="muted">
              {formatStations(cafe.stationCount)}
            </Text>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.9,
  },
  cover: {
    width: '100%',
    height: CAFE_CARD_COVER_HEIGHT,
  },
  coverFallback: {
    backgroundColor: colors.surfaceRaised,
  },
  body: {
    padding: spacing.lg,
    gap: spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: spacing.sm,
  },
});
