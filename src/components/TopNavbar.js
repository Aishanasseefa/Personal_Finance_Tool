import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { logout } from './../config/auth';

const TopNavbar = ({ username, navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current; // Use useRef to persist across renders
  const slideAnim = useRef(new Animated.Value(-30)).current; // Persist slide animation
  const buttonScale = useRef(new Animated.Value(1)).current; // Persist button scale

  useEffect(() => {
    // Reset animations to initial values before starting
    fadeAnim.setValue(0);
    slideAnim.setValue(-30);

    // Start the animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 60,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start(() => {
      console.log('Animation completed, opacity should be 1');
    });

    // Cleanup: Reset on unmount (optional, for safety)
    return () => {
      fadeAnim.setValue(0);
      slideAnim.setValue(-30);
    };
  }, []); // Empty dependency array ensures it runs only on mount

  const handleLogout = async () => {
    Animated.sequence([
      Animated.timing(buttonScale, { toValue: 0.9, duration: 100, useNativeDriver: true }),
      Animated.timing(buttonScale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start(async () => {
      await logout();
      navigation.replace('Login');
    });
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <LinearGradient
        colors={['#2a4365', '#1e3a8a']}
        style={styles.navbar}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.leftSection}>
          <Text style={styles.title}>Expense Tracker</Text>
          <Text style={styles.username}>{username || 'User'}</Text>
        </View>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <LinearGradient
              colors={['#f87171', '#ef4444']}
              style={styles.logoutGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Icon name="logout" size={22} color="#ffffff" />
              <Text style={styles.logoutText}>Logout</Text>
            </LinearGradient>
          </Animated.View>
        </TouchableOpacity>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 40,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  leftSection: {
    flexDirection: 'column',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5,
    fontFamily: 'System',
  },
  username: {
    fontSize: 16,
    color: '#e5e7eb',
    fontWeight: '600',
    marginTop: 4,
    letterSpacing: 0.3,
  },
  logoutButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  logoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  logoutText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 6,
  },
});

export default TopNavbar;