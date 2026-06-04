import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

export default function AnimatedCard({ children, index = 0, style }) {
  const translateY = useRef(new Animated.Value(50)).current;
  const opacity    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const delay = Math.min(index * 70, 500);
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1, duration: 400, delay, useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0, tension: 65, friction: 10, delay, useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[{ opacity, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
}
