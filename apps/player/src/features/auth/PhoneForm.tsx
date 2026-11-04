import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { Button } from '../../components/Button';
import { Notice } from '../../components/Notice';
import { Text } from '../../components/Text';
import { colors, radii, spacing, touchTarget, typeScale } from '../../lib/theme';
import { INDIA_DIAL_CODE, normaliseIndianMobileInput, toIndianMobileE164 } from './phone';

export interface PhoneFormProps {
  pending: boolean;
  /** A failure from the gateway, already turned into copy. */
  error: string | null;
  /** Receives the number in E.164 form (`+91…`). */
  onSubmit: (phone: string) => void;
}

export function PhoneForm({ pending, error, onSubmit }: PhoneFormProps) {
  const [input, setInput] = useState('');
  const [invalid, setInvalid] = useState(false);

  const submit = () => {
    const phone = toIndianMobileE164(input);
    if (phone === null) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    onSubmit(phone);
  };

  return (
    <View style={styles.root}>
      <Text variant="heading">Your mobile number</Text>
      <Text tone="muted">We send a one-time code by SMS. No password, nothing else stored.</Text>
      <View style={styles.field}>
        <Text variant="subheading" tone="muted">
          {INDIA_DIAL_CODE}
        </Text>
        <TextInput
          accessibilityLabel="Mobile number"
          value={input}
          // Autofill offers "+91 98765 43210" (15 characters); the normaliser keeps the ten digits
          // a player meant, so no maxLength: a cap on the raw text would truncate that to "+91 98765 ".
          onChangeText={(text) => {
            setInput(normaliseIndianMobileInput(text));
            setInvalid(false);
          }}
          onSubmitEditing={submit}
          keyboardType="phone-pad"
          autoComplete="tel"
          textContentType="telephoneNumber"
          placeholder="98765 43210"
          placeholderTextColor={colors.textSubtle}
          autoFocus
          style={styles.input}
        />
      </View>
      {invalid ? <Notice tone="error" message="Enter a 10-digit Indian mobile number." /> : null}
      {error === null ? null : <Notice tone="error" message={error} />}
      <Button label="Send code" onPress={submit} loading={pending} block />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.md,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: touchTarget + 8,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    ...typeScale.subheading,
    color: colors.text,
    paddingVertical: spacing.sm,
  },
});
