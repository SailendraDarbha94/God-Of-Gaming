import type { Game } from '@gog/domain';
import { StyleSheet, View } from 'react-native';

import { Chip } from '../../components/Chip';
import { Text } from '../../components/Text';
import { spacing } from '../../lib/theme';

export interface GameChipsProps {
  games: Game[];
}

export function GameChips({ games }: GameChipsProps) {
  if (games.length === 0) {
    return <Text tone="muted">No games listed yet.</Text>;
  }
  return (
    <View style={styles.wrap}>
      {games.map((game) => (
        <Chip key={game.id} label={game.name} />
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
