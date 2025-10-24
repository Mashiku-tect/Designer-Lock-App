import React, { useEffect } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

const DotWaveIndicator = ({ color = '#007AFF', dotSize = 8, dotCount = 3 }) => {
  const animations = Array.from({ length: dotCount }, () => new Animated.Value(0));

  useEffect(() => {
    const animateDots = animations.map((anim, index) => 
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 150),
          Animated.timing(anim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      )
    );

    animateDots.forEach(animation => animation.start());

    return () => {
      animateDots.forEach(animation => animation.stop());
    };
  }, []);

  return (
    <View style={styles.container}>
      {animations.map((anim, index) => (
        <Animated.View
          key={index}
          style={[
            styles.dot,
            {
              width: dotSize,
              height: dotSize,
              backgroundColor: color,
              transform: [
                {
                  scale: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.3, 1],
                  }),
                },
              ],
              opacity: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.3, 1],
              }),
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  dot: {
    borderRadius: 50,
    marginHorizontal: 4,
  },
});

export default DotWaveIndicator;