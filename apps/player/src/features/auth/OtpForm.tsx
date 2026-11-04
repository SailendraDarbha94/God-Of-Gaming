import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { Button } from '../../components/Button';
import { Notice } from '../../components/Notice';
import { Text } from '../../components/Text';
import { colors, radii, spacing, touchTarget, typeScale } from '../../lib/theme';

export interface OtpFormProps {
  /** The number the code went to, in E.164 form, shown so a typo is easy to spot. */
  phone: string;
  pending: boolean;
  error: string | null;
  onSubmit: (token: string) => void;
  onResend: () => void;
  onChangeNumber: () => void;
}

const OTP_LENGTH = 6;

export function OtpForm({
  phone,
  pending,
  error,
  onSubmit,
  onResend,
  onChangeNumber,
}: OtpFormProps) {
  const [token, setToken] = useState('');
  const complete = token.length === OTP_LENGTH;

  const submit = () => {
    if (complete) {
      onSubmit(token);
    }
  };

  return (
    <View style={styles.root}>
      <Text variant="heading">Enter the code</Text>
      <Text tone="muted">Sent by SMS to {phone}.</Text>
      <TextInput
        accessibilityLabel="One-time code"
        value={token}
        onChangeText={(text) => {
          setToken(text.replace(/\D/g, '').slice(0, OTP_LENGTH));
        }}
        onSubmitEditing={submit}
        keyboardType="number-pad"
        autoComplete="sms-otp"
        textContentType="oneTimeCode"
        maxLength={OTP_LENGTH}
        placeholder="123456"
        placeholderTextColor={colors.textSubtle}
        autoFocus
        style={styles.input}
      />
      {error === null ? null : <Notice tone="error" message={error} />}
      <Button label="Verify" onPress={submit} disabled={!complete} loading={pending} block />
      <View style={styles.secondary}>
        <Button label="Resend code" variant="ghost" onPress={onResend} disabled={pending} />
        <Button label="Change number" variant="ghost" onPress={onChangeNumber} disabled={pending} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.md,
  },
  input: {
    ...typeScale.title,
    color: colors.text,
    letterSpacing: 8,
    textAlign: 'center',
    minHeight: touchTarget + 16,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  secondary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
