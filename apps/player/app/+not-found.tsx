import { Stack, useRouter } from 'expo-router';

import { EmptyState } from '../src/components/EmptyState';
import { Screen } from '../src/components/Screen';

export default function NotFoundScreen() {
  const router = useRouter();
  return (
    <>
      <Stack.Screen options={{ title: 'Not found' }} />
      <Screen>
        <EmptyState
          title="That screen does not exist"
          message="The link may be out of date."
          actionLabel="Back to Explore"
          onAction={() => {
            router.replace('/');
          }}
        />
      </Screen>
    </>
  );
}
