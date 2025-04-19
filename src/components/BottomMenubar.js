import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';

const BottomMenubar = ({ navigation, userId, activeRoute = 'Home' }) => {
  const handlePress = (route) => {
    navigation.navigate(route, { userId });
  };

  const items = [
    { name: 'Home', icon: 'home', route: 'HomeScreen' },
    { name: 'Notifications', icon: 'bell', route: 'Notifications' },
    { name: 'Profile', icon: 'account', route: 'Profile' },
  ];

  return (
    <LinearGradient
      colors={['#2a4365', '#1e3a8a']} // Match TopNavbar gradient
      style={styles.menubar}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {items.map((item) => (
        <TouchableOpacity
          key={item.name}
          style={[
            styles.menuItem,
            activeRoute === item.name && styles.activeItem,
          ]}
          onPress={() => handlePress(item.route)}
        >
          <Icon
            name={item.icon}
            size={28}
            color={activeRoute === item.name ? '#60a5fa' : '#a0aec0'}
          />
          <Text
            style={[
              styles.menuText,
              activeRoute === item.name && styles.activeText,
            ]}
          >
            {item.name}
          </Text>
        </TouchableOpacity>
      ))}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  menubar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingBottom: 10, // Extra padding for safe area on iOS
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2, // Slightly stronger shadow to match TopNavbar
    shadowRadius: 12,
    elevation: 8,
  },
  menuItem: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 12,
  },
  activeItem: {
    backgroundColor: 'rgba(96, 165, 250, 0.15)', // Slightly more opaque active background
  },
  menuText: {
    fontSize: 12,
    color: '#a0aec0', // Light gray for inactive text
    fontWeight: '700',
    marginTop: 4,
    fontFamily: 'System', // Replace with 'Inter' or 'Roboto' for premium feel
  },
  activeText: {
    color: '#60a5fa', // Vibrant blue for active text
  },
});

export default BottomMenubar;