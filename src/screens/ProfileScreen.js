import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiProvider from '../config/ApiProvider';
import { getUserId } from '../config/auth';
import TopNavbar from '../components/TopNavbar';
import BottomMenubar from '../components/BottomMenubar';

const ProfileScreen = ({ route, navigation }) => {
  const [userId, setUserId] = useState(route?.params?.userId || null);
  const [userData, setUserData] = useState({
    username: '',
    name: '',
    gender: '',
    age: '',
    salary: '',
  });
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        let effectiveUserId = userId;
        if (!effectiveUserId) {
          effectiveUserId = await getUserId();
          setUserId(effectiveUserId);
          console.log('Fetched userId from AsyncStorage:', effectiveUserId);
          console.log('AsyncStorage contents:', await AsyncStorage.getAllKeys());
        }
        if (!effectiveUserId) {
          navigation.replace('Login');
          return;
        }
        const data = await ApiProvider.getUser(effectiveUserId);
        console.log('Fetched user data:', data);
        setUserData({
          username: data.username || '',
          name: data.name || '',
          gender: data.gender || '',
          age: data.age ? data.age.toString() : '',
          salary: data.salary ? data.salary.toString() : '',
        });
      } catch (error) {
        console.error('Error fetching user data:', error);
        alert('Failed to load profile: ' + error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [userId, navigation]);

  const handleUpdateProfile = async () => {
    try {
      setLoading(true);
      const { username, name, gender, age, salary } = userData;
      if (!username || !name || !gender || !age) {
        alert('All profile fields are required');
        return;
      }
      if (username.length < 3) {
        alert('Username must be at least 3 characters');
        return;
      }
      if (!['male', 'female', 'other'].includes(gender.toLowerCase())) {
        alert('Gender must be male, female, or other');
        return;
      }
      const ageNum = parseInt(age, 10);
      if (isNaN(ageNum) || ageNum < 0 || ageNum > 150) {
        alert('Age must be a number between 0 and 150');
        return;
      }
      const updatedData = {
        username,
        name,
        gender: gender.toLowerCase(),
        age: ageNum,
        salary: parseFloat(salary) || 0,
      };
      console.log('Sending profile update:', updatedData);
      await ApiProvider.updateUser(userId, updatedData);
      alert('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    try {
      setLoading(true);
      const { oldPassword, newPassword } = passwordData;
      const { username, name, gender, age, salary } = userData;
      if (!oldPassword || !newPassword) {
        alert('Both old and new passwords are required');
        return;
      }
      if (newPassword.length < 3) {
        alert('New password must be at least 3 characters');
        return;
      }
      const isValid = await ApiProvider.verifyPassword(userId, oldPassword);
      if (!isValid) {
        alert('Old password is incorrect');
        return;
      }
      const updatedData = {
        username,
        password: newPassword,
        name,
        gender: gender.toLowerCase(),
        age: parseInt(age, 10),
        salary: parseFloat(salary) || 0,
      };
      console.log('Sending password update:', updatedData);
      await ApiProvider.updateUser(userId, updatedData);
      alert('Password updated successfully');
      setPasswordData({ oldPassword: '', newPassword: '' });
    } catch (error) {
      console.error('Error updating password:', error);
      alert('Failed to update password: ' + error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.container}>
        <TopNavbar username={userData.username || 'User'} navigation={navigation} />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <LinearGradient
            colors={['#2a4365', '#1e3a8a']}
            style={styles.headerCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.headerTitle}>Your Profile</Text>
            <Text style={styles.headerSubtitle}>Update your personal details</Text>
          </LinearGradient>

          {loading ? (
            <Text style={styles.loadingText}>Loading...</Text>
          ) : (
            <>
              <LinearGradient
                colors={['#374151', '#1f2937']}
                style={styles.formCard}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.form}>
                  <Text style={styles.sectionTitle}>Personal Information</Text>
                  <Text style={styles.label}>Username</Text>
                  <TextInput
                    style={styles.inputFull}
                    value={userData.username}
                    onChangeText={(text) => setUserData({ ...userData, username: text })}
                    placeholder="Enter username"
                    placeholderTextColor="#9ca3af"
                  />
                  <Text style={styles.label}>Name</Text>
                  <TextInput
                    style={styles.inputFull}
                    value={userData.name}
                    onChangeText={(text) => setUserData({ ...userData, name: text })}
                    placeholder="Enter name"
                    placeholderTextColor="#9ca3af"
                  />
                  <View style={styles.row}>
                    <View style={styles.halfInputContainer}>
                      <Text style={styles.label}>Gender</Text>
                      <TextInput
                        style={styles.inputHalf}
                        value={userData.gender}
                        onChangeText={(text) => setUserData({ ...userData, gender: text })}
                        placeholder="e.g., Male"
                        placeholderTextColor="#9ca3af"
                      />
                    </View>
                    <View style={styles.halfInputContainer}>
                      <Text style={styles.label}>Age</Text>
                      <TextInput
                        style={styles.inputHalf}
                        value={userData.age}
                        onChangeText={(text) => setUserData({ ...userData, age: text })}
                        placeholder="e.g., 30"
                        placeholderTextColor="#9ca3af"
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                  <Text style={styles.label}>Salary</Text>
                  <TextInput
                    style={styles.inputFull}
                    value={userData.salary}
                    onChangeText={(text) => setUserData({ ...userData, salary: text })}
                    placeholder="Enter salary"
                    placeholderTextColor="#9ca3af"
                    keyboardType="decimal-pad"
                  />
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleUpdateProfile}
                    disabled={loading}
                  >
                    <LinearGradient
                      colors={['#60a5fa', '#2563eb']}
                      style={styles.buttonGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Text style={styles.buttonText}>{loading ? 'Saving...' : 'Save Profile'}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </LinearGradient>

              <LinearGradient
                colors={['#374151', '#1f2937']}
                style={styles.formCard}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.form}>
                  <Text style={styles.sectionTitle}>Change Password</Text>
                  <Text style={styles.label}>Current Password</Text>
                  <TextInput
                    style={styles.inputFull}
                    value={passwordData.oldPassword}
                    onChangeText={(text) => setPasswordData({ ...passwordData, oldPassword: text })}
                    placeholder="Enter current password"
                    placeholderTextColor="#9ca3af"
                    secureTextEntry
                  />
                  <Text style={styles.label}>New Password</Text>
                  <TextInput
                    style={styles.inputFull}
                    value={passwordData.newPassword}
                    onChangeText={(text) => setPasswordData({ ...passwordData, newPassword: text })}
                    placeholder="Enter new password"
                    placeholderTextColor="#9ca3af"
                    secureTextEntry
                  />
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleUpdatePassword}
                    disabled={loading}
                  >
                    <LinearGradient
                      colors={['#f97316', '#c2410c']}
                      style={styles.buttonGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Text style={styles.buttonText}>{loading ? 'Saving...' : 'Update Password'}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </>
          )}
        </ScrollView>
        <BottomMenubar navigation={navigation} userId={userId} activeRoute="Profile" />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#111827',
  },
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  headerCard: {
    borderRadius: 25,
    padding: 25,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 15,
    elevation: 10,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#f3f4f6',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 8,
  },
  formCard: {
    borderRadius: 20,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  form: {
    padding: 25,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f3f4f6',
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: '#d1d5db',
    marginBottom: 8,
  },
  inputFull: {
    borderWidth: 1,
    borderColor: '#4b5563',
    borderRadius: 15,
    padding: 14,
    fontSize: 16,
    color: '#f3f4f6',
    backgroundColor: '#1f2937',
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  halfInputContainer: {
    width: '48%',
  },
  inputHalf: {
    borderWidth: 1,
    borderColor: '#4b5563',
    borderRadius: 15,
    padding: 14,
    fontSize: 16,
    color: '#f3f4f6',
    backgroundColor: '#1f2937',
  },
  saveButton: {
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  loadingText: {
    fontSize: 18,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 30,
    fontWeight: '600',
  },
});

export default ProfileScreen;