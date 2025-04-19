import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import ApiProvider from '../config/ApiProvider';
import { getUserId } from '../config/auth';

const SuggestionScreen = ({ route, navigation }) => {
  const [userId, setUserId] = useState(route?.params?.userId || null);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const currentMonth = new Date().toLocaleString('default', { month: 'long' });
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const initializeUserAndFetch = async () => {
      try {
        setLoading(true);
        let effectiveUserId = userId;
        if (!effectiveUserId) {
          effectiveUserId = await getUserId();
          setUserId(effectiveUserId);
        }
        if (!effectiveUserId) {
          navigation.replace('Login');
          return;
        }
        await fetchSuggestions(effectiveUserId);
      } catch (error) {
        console.error('Error initializing:', error);
        alert('Failed to initialize: ' + error);
      } finally {
        setLoading(false);
      }
    };
    initializeUserAndFetch();
  }, [userId, navigation]);

  const fetchSuggestions = async (effectiveUserId) => {
    try {
      const suggestionData = await ApiProvider.getSuggestions(effectiveUserId);
      console.log('Fetched Suggestions:', suggestionData);

      const currentMonthSuggestions = suggestionData.filter(
        (s) => s.month === currentMonth && s.year === currentYear
      );

      if (currentMonthSuggestions.length === 0) {
        console.log('No suggestions for current month, generating...');
        try {
          await ApiProvider.addSuggestion(effectiveUserId);
          const updatedSuggestions = await ApiProvider.getSuggestions(effectiveUserId);
          console.log('Generated Suggestions:', updatedSuggestions);
          setSuggestions(Array.isArray(updatedSuggestions) ? updatedSuggestions : []);
        } catch (genError) {
          console.error('Generation Error:', genError);
          alert('Failed to generate suggestions. Showing existing data.');
          setSuggestions(Array.isArray(suggestionData) ? suggestionData : []);
        }
      } else {
        setSuggestions(Array.isArray(suggestionData) ? suggestionData : []);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      alert('Failed to load suggestions: ' + error);
    }
  };

  const regenerateSuggestions = async () => {
    try {
      setLoading(true);
      if (!userId) return;
      await ApiProvider.addSuggestion(userId);
      await fetchSuggestions(userId);
      alert('Suggestions regenerated for ' + currentMonth);
    } catch (error) {
      console.error('Error regenerating suggestions:', error);
      alert('Failed to regenerate suggestions: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const groupSuggestionsByMonth = () => {
    const grouped = {};
    suggestions.forEach((item) => {
      const key = `${item.month} ${item.year}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(item);
    });
    return Object.entries(grouped).sort(([a], [b]) => {
      const aIsCurrent = a === `${currentMonth} ${currentYear}`;
      const bIsCurrent = b === `${currentMonth} ${currentYear}`;
      if (aIsCurrent && !bIsCurrent) return -1;
      if (!aIsCurrent && bIsCurrent) return 1;
      const [aMonth, aYear] = a.split(' ');
      const [bMonth, bYear] = b.split(' ');
      return (Number(bYear) - Number(aYear)) || (new Date(bMonth + ' 1').getMonth() - new Date(aMonth + ' 1').getMonth());
    });
  };

  const renderSuggestionItem = ({ item }) => {
    const amount = item.suggested_amount !== undefined && !isNaN(item.suggested_amount)
      ? Number(item.suggested_amount).toFixed(2)
      : 'N/A';
    return (
      <LinearGradient
        colors={['#2d3748', '#1a202c']}
        style={styles.suggestionItem}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.categoryText}>
          {item.category_name || 'Unknown Category'}
        </Text>
        <Text style={styles.amountText}>₹{amount}</Text>
      </LinearGradient>
    );
  };

  const renderMonthGroup = ({ item }) => {
    const [monthYear, items] = item;
    const isCurrentMonth = monthYear === `${currentMonth} ${currentYear}`;
    return (
      <View style={styles.monthGroup}>
        <LinearGradient
          colors={isCurrentMonth ? ['#4b5e9e', '#2a4365'] : ['#374151', '#1f2937']}
          style={styles.monthHeader}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.monthTitle}>{monthYear}</Text>
        </LinearGradient>
        <FlatList
          data={items}
          keyExtractor={(item) => `${item.category_id}-${item.month}-${item.year}`}
          renderItem={renderSuggestionItem}
          contentContainerStyle={styles.monthContent}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.container}>
        <LinearGradient
          colors={['#2a4365', '#1e3a8a']}
          style={styles.navbar}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-left" size={28} color="#f3f4f6" />
          </TouchableOpacity>
          <Text style={styles.navbarTitle}>Smart Suggestions</Text>
          <TouchableOpacity onPress={regenerateSuggestions} style={styles.regenerateButton}>
            <Icon name="refresh" size={28} color="#f3f4f6" />
          </TouchableOpacity>
        </LinearGradient>

        {loading ? (
          <Text style={styles.loadingText}>Loading...</Text>
        ) : suggestions.length === 0 ? (
          <Text style={styles.noDataText}>No suggestions available</Text>
        ) : (
          <FlatList
            data={groupSuggestionsByMonth()}
            keyExtractor={(item) => item[0]}
            renderItem={renderMonthGroup}
            contentContainerStyle={styles.flatListContent}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: { flex: 1, backgroundColor: '#111827' },
  container: { flex: 1, backgroundColor: '#111827' },
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 40,
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
  backButton: { padding: 5 },
  regenerateButton: { padding: 5 },
  navbarTitle: { fontSize: 24, fontWeight: '700', color: '#f3f4f6', letterSpacing: 0.5 },
  flatListContent: { padding: 20, paddingBottom: 20 },
  monthGroup: { marginBottom: 20 },
  monthHeader: {
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  monthTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f3f4f6',
    textAlign: 'center',
  },
  monthContent: { paddingLeft: 10 },
  suggestionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  categoryText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f3f4f6',
    flex: 1,
    marginRight: 10,
  },
  amountText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#60a5fa',
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

export default SuggestionScreen;