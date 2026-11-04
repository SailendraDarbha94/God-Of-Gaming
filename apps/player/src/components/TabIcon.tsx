import { StyleSheet, View, type ColorValue } from 'react-native';

export type TabIconName = 'explore' | 'bookings' | 'profile';

export interface TabIconProps {
  name: TabIconName;
  color: ColorValue;
  size: number;
  focused: boolean;
}

/**
 * Tab glyphs drawn from plain views, so the app ships no icon font or third-party artwork
 * (spec 06 §Configuration). Focused tabs render filled, the others outlined.
 */
export function TabIcon({ name, color, size, focused }: TabIconProps) {
  const stroke = 2;
  const fill = focused ? color : 'transparent';
  const box = { width: size, height: size };

  switch (name) {
    case 'explore':
      return (
        <View style={[styles.center, box]}>
          <View
            style={{
              width: size * 0.8,
              height: size * 0.8,
              borderRadius: size,
              borderWidth: stroke,
              borderColor: color,
              backgroundColor: fill,
            }}
          />
          <View
            style={[
              styles.absolute,
              {
                width: size * 0.22,
                height: size * 0.22,
                borderRadius: size,
                backgroundColor: focused ? 'transparent' : color,
                borderWidth: focused ? stroke : 0,
                borderColor: color,
              },
            ]}
          />
        </View>
      );
    case 'bookings':
      return (
        <View style={[styles.center, box]}>
          <View
            style={{
              width: size * 0.85,
              height: size * 0.7,
              borderRadius: size * 0.16,
              borderWidth: stroke,
              borderColor: color,
              backgroundColor: fill,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <View
              style={{
                width: size * 0.45,
                height: stroke,
                backgroundColor: focused ? 'transparent' : color,
              }}
            />
          </View>
        </View>
      );
    case 'profile':
      return (
        <View style={[styles.center, box]}>
          <View
            style={{
              width: size * 0.4,
              height: size * 0.4,
              borderRadius: size,
              borderWidth: stroke,
              borderColor: color,
              backgroundColor: fill,
              marginBottom: size * 0.05,
            }}
          />
          <View
            style={{
              width: size * 0.8,
              height: size * 0.36,
              borderTopLeftRadius: size,
              borderTopRightRadius: size,
              borderWidth: stroke,
              borderBottomWidth: 0,
              borderColor: color,
              backgroundColor: fill,
            }}
          />
        </View>
      );
  }
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  absolute: {
    position: 'absolute',
  },
});
