import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Dimensions, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { PieChart, LineChart } from 'react-native-chart-kit';
import ApiProvider from '../config/ApiProvider';

const PieChartComponent = ({ data }) => {
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  if (!data || data.length === 0) return <Text style={styles.chartText}>No Data Available</Text>;

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <PieChart
        data={data.map(item => ({
          name: item.category_name,
          population: item.total_amount,
          color: '#' + Math.floor(Math.random() * 16777215).toString(16),
          legendFontColor: '#f3f4f6',
          legendFontSize: 12,
        }))}
        width={Dimensions.get('window').width - 60} // Reduced width to prevent overflow
        height={200} // Reduced height to fit better
        chartConfig={{
          backgroundColor: '#2d3748',
          color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
        }}
        accessor="population"
        backgroundColor="transparent"
        paddingLeft="10"
        absolute
        style={styles.chartStyle}
        hasLegend={true}
        center={[10, 0]} // Adjusted center to reduce overlap
      />
    </Animated.View>
  );
};

const LineChartComponent = ({ data }) => {
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  if (!data || data.length === 0) return <Text style={styles.chartText}>No Data Available</Text>;

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <LineChart
        data={{
          labels: data.map(item => item.month),
          datasets: [{ data: data.map(item => item.total_amount) }],
        }}
        width={Dimensions.get('window').width - 60} // Reduced width to prevent overflow
        height={200} // Reduced height to fit better
        chartConfig={{
          backgroundGradientFrom: '#1e3a8a',
          backgroundGradientTo: '#2a4365',
          color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
          propsForLabels: {
            fontSize: 10, // Smaller font size for labels
          },
        }}
        bezier
        style={styles.chartStyle}
      />
    </Animated.View>
  );
};

const ReportScreen = ({ route, navigation }) => {
  const { userId } = route.params;
  const [categoryExpenses, setCategoryExpenses] = useState([]);
  const [priorityVsSpending, setPriorityVsSpending] = useState([]);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [userId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [categoryData, priorityData, trendData] = await Promise.all([
        ApiProvider.getExpensesByCategory(userId),
        ApiProvider.getPriorityVsSpending(userId),
        ApiProvider.getMonthlyExpenseTrends(userId),
      ]);
      setCategoryExpenses(categoryData || []);
      setPriorityVsSpending(priorityData || []);
      setTrends(trendData || []);
    } catch (error) {
      console.error('Error fetching report data:', error);
      alert('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.container}>
        <LinearGradient colors={['#2a4365', '#1e3a8a']} style={styles.navbar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-left" size={28} color="#f3f4f6" />
          </TouchableOpacity>
          <Text style={styles.navbarTitle}>Financial Reports</Text>
          <TouchableOpacity onPress={fetchData} style={styles.refreshButton}>
            <Icon name="refresh" size={28} color="#f3f4f6" />
          </TouchableOpacity>
        </LinearGradient>
        <ScrollView contentContainerStyle={styles.content}>
          {loading ? (
            <Text style={styles.loadingText}>Loading Reports...</Text>
          ) : (
            <>
              <LinearGradient colors={['#374151', '#1f2937']} style={styles.card}>
                <Text style={styles.sectionTitle}>Expense Breakdown</Text>
                <PieChartComponent data={categoryExpenses} />
              </LinearGradient>

              <LinearGradient colors={['#374151', '#1f2937']} style={styles.card}>
                <Text style={styles.sectionTitle}>Priority vs Spending</Text>
                <ScrollView style={styles.priorityList}>
                  {priorityVsSpending.length > 0 ? (
                    priorityVsSpending.map((item, index) => (
                      <LinearGradient key={index} colors={['#2d3748', '#1a202c']} style={styles.reportCard}>
                        <Text style={styles.reportTitle}>{item.category_name} ({item.priority})</Text>
                        <Text style={styles.reportText}>
                          Spent: ₹{Number(item.total_amount || 0).toFixed(2)} / Suggested: ₹{Number(item.suggested_amount).toFixed(2)}
                        </Text>
                      </LinearGradient>
                    ))
                  ) : (
                    <Text style={styles.chartText}>No Priority Data</Text>
                  )}
                </ScrollView>
              </LinearGradient>

              <LinearGradient colors={['#374151', '#1f2937']} style={styles.card}>
                <Text style={styles.sectionTitle}>Monthly Trends</Text>
                <LineChartComponent data={trends} />
              </LinearGradient>
            </>
          )}
        </ScrollView>
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
  refreshButton: { padding: 5 },
  navbarTitle: { fontSize: 24, fontWeight: '700', color: '#f3f4f6', letterSpacing: 0.5 },
  content: { padding: 20, paddingBottom: 40 },
  card: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#f3f4f6',
    marginBottom: 15,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  chartStyle: {
    borderRadius: 10,
    padding: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  chartText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9ca3af',
    textAlign: 'center',
    marginVertical: 20,
  },
  priorityList: { maxHeight: 200 },
  reportCard: {
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f3f4f6',
    marginBottom: 5,
  },
  reportText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#d1d5db',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 50,
  },
});

export default ReportScreen;