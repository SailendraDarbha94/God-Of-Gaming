import type { Booking } from '@gog/domain';
import { Alert } from 'react-native';

import { BOOKING_CANCEL_LABELS, CANCEL_CONFIRMATION } from './copy';

/**
 * One rule for both screens: releasing a hold is one tap (the timer would release it anyway), while
 * cancelling a confirmed session is irreversible and asks first. `cancelable: true` lets the Android
 * back button or a tap outside keep the booking, and the message carries the consequence because
 * Android ignores the iOS-only button styles. A booking in any other state cannot be cancelled and
 * the call is ignored; the server answers `invalid_state` if a stale screen tries anyway.
 */
export function confirmCancel(booking: Booking, onConfirm: () => void): void {
  switch (booking.status) {
    case 'held':
      onConfirm();
      return;
    case 'confirmed':
      Alert.alert(
        CANCEL_CONFIRMATION.title,
        CANCEL_CONFIRMATION.message,
        [
          { text: CANCEL_CONFIRMATION.keep, style: 'cancel' },
          { text: BOOKING_CANCEL_LABELS.confirmed, style: 'destructive', onPress: onConfirm },
        ],
        { cancelable: true },
      );
      return;
    case 'cancelled':
    case 'expired':
    case 'completed':
    case 'no_show':
      return;
  }
}
