/** app/+not-found.tsx */
import { Phone, Screen } from '@board/chrome';
import { EmptyState } from '@board/components/shared';
import type { Screen as BoardScreen } from '@board/dsl';
import type { Scenario } from '@board/scenario';

const ROUTE = 'app/+not-found.tsx';

// The route reads no data and no hook but useRouter(), so it has one state and takes nothing from
// the scenario.
export function screens(_s: Scenario): BoardScreen[] {
  return [
    Phone({
      key: 'not-found',
      name: 'Not found',
      route: ROUTE,
      note: 'What any address the app has no screen for opens, such as an out-of-date link. The button swaps this screen for Explore.',
      // <Stack.Screen options={{ title: 'Not found' }} /> (+not-found.tsx:10, and app/_layout.tsx:53).
      // No back button: a link that opens the app here leaves nothing under it in the stack.
      header: { title: 'Not found' },
      content: Screen(
        {},
        EmptyState({
          title: 'That screen does not exist',
          message: 'The link may be out of date.',
          actionLabel: 'Back to Explore',
          // router.replace('/') (+not-found.tsx:17): '/' is app/(tabs)/index.tsx.
          action: { go: 'explore', goHow: 'replace' },
        }),
      ),
    }),
  ];
}
