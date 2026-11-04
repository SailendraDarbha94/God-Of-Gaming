import { BOOKING_RULES } from '@gog/domain';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '../../components/Text';
import { formatSeats, formatStations } from '../../lib/format';
import { colors, radii, spacing, touchTarget } from '../../lib/theme';

export interface SeatStepperProps {
  value: number;
  /** The upper bound for this tier: the booking rule or the tier's station count, whichever is lower. */
  max: number;
  onChange: (seats: number) => void;
}

/** Squad size, 1 to 10 (spec 02 §Constants), never more than the tier has stations. */
export function SeatStepper({ value, max, onChange }: SeatStepperProps) {
  const canDecrement = value > BOOKING_RULES.minSeats;
  const canIncrement = value < max;
  const cappedByTier = max < BOOKING_RULES.maxSeats && value >= max;

  return (
    <View style={styles.root}>
      <View
        accessibilityRole="adjustable"
        accessibilityLabel="Seats"
        accessibilityValue={{ text: formatSeats(value) }}
        style={styles.stepper}
      >
        <StepButton
          label="−"
          accessibilityLabel="One seat fewer"
          disabled={!canDecrement}
          onPress={() => {
            onChange(value - 1);
          }}
        />
        <Text variant="subheading" style={styles.value}>
          {formatSeats(value)}
        </Text>
        <StepButton
          label="+"
          accessibilityLabel="One seat more"
          disabled={!canIncrement}
          onPress={() => {
            onChange(value + 1);
          }}
        />
      </View>
      {cappedByTier ? (
        <Text variant="caption" tone="muted">
          This tier has {formatStations(max)}.
        </Text>
      ) : null}
    </View>
  );
}

interface StepButtonProps {
  label: string;
  accessibilityLabel: string;
  disabled: boolean;
  onPress: () => void;
}

function StepButton({ label, accessibilityLabel, disabled, onPress }: StepButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.step, pressed && styles.pressed, disabled && styles.disabled]}
    >
      <Text variant="heading">{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
  },
  step: {
    width: touchTarget + 4,
    height: touchTarget + 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    minWidth: 88,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.35,
  },
});
