import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import ApiProvider from '../config/ApiProvider';

const PriorityScreen = ({ route, navigation }) => {
  const { userId } = route.params;
  const [priorities, setPriorities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  const priorityOptions = ['high', 'medium', 'low'];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [priorityData, categoryData] = await Promise.all([
          ApiProvider.getPriorities(userId),
          ApiProvider.getCategories(),
        ]);
        setCategories(categoryData || []);

        if (!categoryData || categoryData.length === 0) {
          alert('No categories available to generate priorities');
          setPriorities([]);
          return;
        }

        const existingPriorityCategoryIds = new Set(
          (priorityData || []).map((p) => p.category_id)
        );
        const newCategories = categoryData.filter(
          (category) => !existingPriorityCategoryIds.has(category.id)
        );

        if (newCategories.length > 0) {
          const newPriorities = newCategories.map((category) => ({
            login_id: userId,
            category_id: category.id,
            priority: priorityOptions[Math.floor(Math.random() * priorityOptions.length)],
          }));
          await Promise.all(
            newPriorities.map((priority) =>
              ApiProvider.addPriority(userId, {
                category_id: priority.category_id,
                priority: priority.priority,
              })
            )
          );
        }

        const updatedPriorities = await ApiProvider.getPriorities(userId);
        setPriorities(updatedPriorities || []);
      } catch (error) {
        console.error('Error fetching or generating priorities:', error);
        alert('Failed to load data: ' + error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId]);

  const handleUpdatePriority = async (priorityId, newPriority) => {
    try {
      setLoading(true);
      const priorityToUpdate = priorities.find((p) => p.id === priorityId);
      await ApiProvider.updatePriority(userId, {
        priority_id: priorityId,
        category_id: priorityToUpdate.category_id,
        priority: newPriority,
      });
      const updatedPriorities = await ApiProvider.getPriorities(userId);
      setPriorities(updatedPriorities);
    } catch (error) {
      console.error('Update priority error:', error);
      alert('Failed to update priority: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const renderPriorityItem = ({ item }) => (
    <LinearGradient
      colors={['#2d3748', '#1a202c']}
      style={styles.priorityItem}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <Text style={styles.priorityText}>
        {categories.find((cat) => cat.id === item.category_id)?.category_name || item.category_id}
      </Text>
      <View style={styles.pickerContainer}>
        <LinearGradient
          colors={['#4b5563', '#374151']}
          style={styles.pickerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Picker
            selectedValue={item.priority}
            style={styles.picker}
            onValueChange={(newValue) => handleUpdatePriority(item.id, newValue)}
            enabled={!loading}
            dropdownIconColor="#fff"
          >
            {priorityOptions.map((option) => (
              <Picker.Item
                key={option}
                label={option.charAt(0).toUpperCase() + option.slice(1)}
                value={option}
                color="#000"
              />
            ))}
          </Picker>
        </LinearGradient>
      </View>
    </LinearGradient>
  );

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.container}>
        {/* Custom Navbar */}
        <LinearGradient
          colors={['#2a4365', '#1e3a8a']}
          style={styles.navbar}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-left" size={28} color="#f3f4f6" />
          </TouchableOpacity>
          <Text style={styles.navbarTitle}>Priorities</Text>
        </LinearGradient>

        {loading ? (
          <Text style={styles.loadingText}>Loading...</Text>
        ) : priorities.length === 0 ? (
          <Text style={styles.noDataText}>No priorities available</Text>
        ) : (
          <FlatList
            data={priorities}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderPriorityItem}
            contentContainerStyle={styles.flatListContent}
          />
        )}
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
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 30, // Extra top padding as requested
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  backButton: {
    padding: 5,
  },
  navbarTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#f3f4f6',
    letterSpacing: 0.5,
  },
  flatListContent: {
    padding: 20,
    paddingBottom: 20,
  },
  priorityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  priorityText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f3f4f6',
    flex: 1,
    marginRight: 10,
  },
  pickerContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    width: 140, // Slightly more compact
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
    
  },
  pickerGradient: {
    padding: 2, // Small padding for gradient border effect
  },
  picker: {
    width: '100%',
    height: 60,
    color: '#f3f4f6',
    backgroundColor: '#374151', // Inner background for contrast
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 30,
  },
  noDataText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default PriorityScreen;