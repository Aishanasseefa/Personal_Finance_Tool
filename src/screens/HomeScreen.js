import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, SafeAreaView, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import TopNavbar from '../components/TopNavbar';
import BottomMenubar from '../components/BottomMenubar';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import ApiProvider from '../config/ApiProvider';
import { getUserId } from '../config/auth';

const HomeScreen = ({ route, navigation }) => {
  const user = route?.params?.user || {};
  const dummyUser = { username: user?.username || 'JohnDoe' };

  const [userId, setUserId] = useState(null);
  const [fixedSalary, setFixedSalary] = useState(0);
  const [additionalIncome, setAdditionalIncome] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [balance, setBalance] = useState(0);
  const [editSalary, setEditSalary] = useState('');
  const [addIncome, setAddIncome] = useState('');
  const [salaryModalVisible, setSalaryModalVisible] = useState(false);
  const [incomeModalVisible, setIncomeModalVisible] = useState(false);
  const [progressData, setProgressData] = useState([]);
  const [priorityVsSpending, setPriorityVsSpending] = useState([]);
  const [transactionCount, setTransactionCount] = useState(0);
  const [priorityCount, setPriorityCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const initializeUserData = async () => {
      try {
        setLoading(true);
        const storedUserId = await getUserId();
        if (!storedUserId) {
          navigation.replace('Login');
          return;
        }
        setUserId(storedUserId);

        const [summary, progressData, expenses, priorities, priorityVsSpending] = await Promise.all([
          ApiProvider.getUserSummary(storedUserId),
          ApiProvider.getProgressBar(storedUserId),
          ApiProvider.getExpenses(storedUserId),
          ApiProvider.getPriorities(storedUserId),
          ApiProvider.getPriorityVsSpending(storedUserId),
        ]);

        setFixedSalary(summary.fixed_salary ?? 0);
        setAdditionalIncome(summary.additional_income ?? 0);
        setTotalIncome(summary.total_income ?? 0);
        setTotalExpenses(summary.total_expenses ?? 0);
        setBalance(summary.balance ?? 0);
        setProgressData(Array.isArray(progressData) ? progressData : []);
        setPriorityVsSpending(Array.isArray(priorityVsSpending) ? priorityVsSpending : []);
        setTransactionCount(expenses.length);
        setPriorityCount(priorities.length);
      } catch (error) {
        console.error('Error initializing user data:', error);
      } finally {
        setLoading(false);
      }
    };
    initializeUserData();
  }, [navigation]);

  const handleUpdateSalary = async () => {
    if (!editSalary || isNaN(editSalary) || Number(editSalary) < 0) {
      alert('Please enter a valid salary');
      return;
    }
    try {
      setLoading(true);
      const updatedData = await ApiProvider.updateSalary(userId, Number(editSalary));
      setFixedSalary(updatedData.salary ?? 0);
      setTotalIncome(Number(editSalary) + additionalIncome);
      setBalance(Number(editSalary) + additionalIncome - totalExpenses);
      setSalaryModalVisible(false);
    } catch (error) {
      alert('Failed to update salary: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddIncome = async () => {
    if (!addIncome || isNaN(addIncome) || Number(addIncome) < 0) {
      alert('Please enter a valid amount');
      return;
    }
    try {
      setLoading(true);
      await ApiProvider.addAdditionalIncome(userId, Number(addIncome));
      const newIncome = Number(additionalIncome) + Number(addIncome);
      setAdditionalIncome(newIncome);
      setTotalIncome(Number(fixedSalary) + Number(newIncome));
      setBalance(Number(fixedSalary) + Number(newIncome) - Number(totalExpenses));
      setIncomeModalVisible(false);
      setAddIncome('');
    } catch (error) {
      alert('Failed to add income: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const renderProgressBar = ({ item }) => {
    const remaining = item.suggested_amount > 0 
      ? Math.max((1 - item.total_amount / item.suggested_amount) * 100, 0) 
      : 100;
    const barColor = remaining <= 20 ? '#ef4444' : remaining <= 50 ? '#f59e0b' : '#10b981';

    return (
      <LinearGradient
        colors={['#2d3748', '#1a202c']}
        style={styles.progressCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.progressTitle}>{item.category_name}</Text>
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${remaining}%`, backgroundColor: barColor }]} />
        </View>
        <Text style={styles.progressText}>
          Remaining: ₹{Number(item.suggested_amount - item.total_amount)} / ₹{Number(item.suggested_amount)}
        </Text>
      </LinearGradient>
    );
  };

  const renderItem = ({ item }) => {
    switch (item.type) {
      case 'financialOverview':
        return (
          <LinearGradient
            colors={['#4a5568', '#2d3748']}
            style={styles.headerCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.headerTitle}>Financial Overview</Text>
            <View style={styles.headerRow}>
              <View style={styles.headerItem}>
                <Text style={styles.headerLabel}>Fixed Salary</Text>
                <Text style={styles.headerValue}>₹{fixedSalary}</Text>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => {
                    setEditSalary(fixedSalary.toString());
                    setSalaryModalVisible(true);
                  }}
                  disabled={loading}
                >
                  <Icon name="pencil" size={20} color="#60a5fa" />
                </TouchableOpacity>
              </View>
              <View style={styles.headerItem}>
                <Text style={styles.headerLabel}>Additional Income</Text>
                <Text style={styles.headerValue}>₹{additionalIncome}</Text>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => setIncomeModalVisible(true)}
                  disabled={loading}
                >
                  <Icon name="plus-circle" size={20} color="#10b981" />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.headerRow}>
              <View style={styles.headerItem}>
                <Text style={styles.headerLabel}>Total Income</Text>
                <Text style={styles.headerValue}>₹{totalIncome}</Text>
              </View>
              <View style={styles.headerItem}>
                <Text style={styles.headerLabel}>Expenses</Text>
                <Text style={styles.headerValue}>₹{totalExpenses}</Text>
              </View>
            </View>
            <Text style={styles.headerBalance}>Balance: ₹{balance}</Text>
          </LinearGradient>
        );
      case 'countCards':
        return (
          <View style={styles.countCardRow}>
            <LinearGradient colors={['#2d3748', '#1a202c']} style={styles.countCard}>
              <Icon name="cash" size={24} color="#60a5fa" />
              <Text style={styles.countValue}>₹{totalExpenses}</Text>
              <Text style={styles.countLabel}>Total Expenses</Text>
            </LinearGradient>
            <LinearGradient colors={['#2d3748', '#1a202c']} style={styles.countCard}>
              <Icon name="receipt" size={24} color="#60a5fa" />
              <Text style={styles.countValue}>{transactionCount}</Text>
              <Text style={styles.countLabel}>Transactions</Text>
            </LinearGradient>
            <LinearGradient colors={['#2d3748', '#1a202c']} style={styles.countCard}>
              <Icon name="priority-high" size={24} color="#60a5fa" />
              <Text style={styles.countValue}>{priorityCount}</Text>
              <Text style={styles.countLabel}>Priorities</Text>
            </LinearGradient>
          </View>
        );
      case 'progressHeader':
        return <Text style={styles.sectionTitle}>Monthly Spending Progress</Text>;
      case 'progress':
        return progressData.length === 0 ? (
          <Text style={styles.noDataText}>No spending data for this month</Text>
        ) : (
          <FlatList
            data={progressData}
            keyExtractor={(item) => item.category_name}
            renderItem={renderProgressBar}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.progressList}
          />
        );
      case 'expenseActionsHeader':
        return <Text style={styles.sectionTitle}>Expense Actions</Text>;
      case 'expenseActions':
        return (
          <View style={styles.actionGroup}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('AddExpense', { userId })}
            >
              <LinearGradient colors={['#ed8936', '#c05621']} style={styles.buttonGradient}>
                <Icon name="plus" size={20} color="#fff" />
                <Text style={styles.buttonText}>Add Expense</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('OnlinePayment', { userId })}
            >
              <LinearGradient colors={['#60a5fa', '#2b6cb0']} style={styles.buttonGradient}>
                <Icon name="credit-card" size={20} color="#fff" />
                <Text style={styles.buttonText}> Payments</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Advance', { userId })}
            >
              <LinearGradient colors={['#60a5fa', '#2b6cb0']} style={styles.buttonGradient}>
                <Icon name="calendar" size={20} color="#fff" />
                <Text style={styles.buttonText}>Advance</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        );
      case 'manageFinancesHeader':
        return <Text style={styles.sectionTitle}>Manage Your Finances</Text>;
      case 'manageFinances':
        return (
          <View style={styles.actionGroup}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Priority', { userId })}
            >
              <LinearGradient colors={['#10b981', '#047857']} style={styles.buttonGradient}>
                <Icon name="sort" size={20} color="#fff" />
                <Text style={styles.buttonText}>Prioritize Category</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
  style={styles.actionButton}
  onPress={() => navigation.navigate('Suggestions', { userId })}
>
  <LinearGradient colors={['#ff0867', '#ff0067']} style={styles.buttonGradient}>
    <Icon name="lightbulb" size={20} color="#fff" />
    <Text style={styles.buttonText}>Optimizations</Text>
  </LinearGradient>
</TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('AdditionalIncome', { userId })}
            >
              <LinearGradient colors={['#10b981', '#047857']} style={styles.buttonGradient}>
                <Icon name="cash-plus" size={20} color="#fff" />
                <Text style={styles.buttonText}>Incomes</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Reports', { userId })}
            >
              <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.buttonGradient}>
                <Icon name="chart-bar" size={20} color="#fff" />
                <Text style={styles.buttonText}>Reports</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        );
      case 'spendingAlignmentHeader':
        return <Text style={styles.sectionTitle}>Spending Alignment</Text>;
      case 'spendingAlignment':
        return (
          <LinearGradient
            colors={['#2d3748', '#1a202c']}
            style={styles.priorityCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.priorityTitle}>{item.category_name} ({item.priority})</Text>
            <Text style={styles.priorityText}>
              Spent: ₹{Number(item.total_amount || 0)} / Suggested: ₹{Number(item.suggested_amount)}
            </Text>
          </LinearGradient>
        );
      default:
        return null;
    }
  };

  const data = [
    { type: 'financialOverview' },
    { type: 'countCards' },
    { type: 'progressHeader' },
    { type: 'progress' },
    { type: 'expenseActionsHeader' },
    { type: 'expenseActions' },
    { type: 'manageFinancesHeader' },
    { type: 'manageFinances' },
    { type: 'spendingAlignmentHeader' },
    ...(priorityVsSpending.length === 0
      ? [{ type: 'noData', key: 'noData' }]
      : priorityVsSpending.map(item => ({ type: 'spendingAlignment', ...item }))),
  ];

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.container}>
        <TopNavbar username={dummyUser.username} navigation={navigation} />
        <FlatList
          data={data}
          renderItem={renderItem}
          keyExtractor={(item, index) => item.type + (item.category_name || index)}
          contentContainerStyle={styles.contentContainer}
          ListEmptyComponent={<Text style={styles.noDataText}>No data available</Text>}
        />
        <View style={styles.bottomMenuContainer}>
          <BottomMenubar navigation={navigation} userId={userId} activeRoute="Home" />
        </View>
      </View>

      {/* Modals */}
      <Modal animationType="fade" transparent visible={salaryModalVisible} onRequestClose={() => setSalaryModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <LinearGradient colors={['#374151', '#1f2937']} style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Salary</Text>
            <TextInput
              style={styles.modalInput}
              value={editSalary}
              onChangeText={setEditSalary}
              keyboardType="decimal-pad"
              placeholder="Enter new salary"
              placeholderTextColor="#9ca3af"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalButton} onPress={handleUpdateSalary} disabled={loading}>
                <LinearGradient colors={['#10b981', '#047857']} style={styles.buttonGradient}>
                  <Text style={styles.buttonText}>{loading ? 'Saving...' : 'Save'}</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButton} onPress={() => setSalaryModalVisible(false)}>
                <LinearGradient colors={['#ef4444', '#b91c1c']} style={styles.buttonGradient}>
                  <Text style={styles.buttonText}>Cancel</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </Modal>

      <Modal animationType="fade" transparent visible={incomeModalVisible} onRequestClose={() => setIncomeModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <LinearGradient colors={['#374151', '#1f2937']} style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Income</Text>
            <TextInput
              style={styles.modalInput}
              value={addIncome}
              onChangeText={setAddIncome}
              keyboardType="decimal-pad"
              placeholder="Enter amount"
              placeholderTextColor="#9ca3af"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalButton} onPress={handleAddIncome} disabled={loading}>
                <LinearGradient colors={['#10b981', '#047857']} style={styles.buttonGradient}>
                  <Text style={styles.buttonText}>{loading ? 'Saving...' : 'Save'}</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButton} onPress={() => setIncomeModalVisible(false)}>
                <LinearGradient colors={['#ef4444', '#b91c1c']} style={styles.buttonGradient}>
                  <Text style={styles.buttonText}>Cancel</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: { flex: 1, backgroundColor: '#111827' },
  container: { flex: 1, backgroundColor: '#111827' },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100, // Space for BottomMenubar
  },
  headerCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#f3f4f6', marginBottom: 15, textAlign: 'center' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  headerItem: { alignItems: 'center', width: '48%', position: 'relative' },
  headerLabel: { fontSize: 14, fontWeight: '600', color: '#d1d5db', marginBottom: 5 },
  headerValue: { fontSize: 20, fontWeight: '800', color: '#60a5fa' },
  headerBalance: { fontSize: 18, fontWeight: '700', color: '#10b981', textAlign: 'center' },
  editButton: { position: 'absolute', top: 0, right: 0 },
  countCardRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  countCard: {
    width: '30%',
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  countValue: { fontSize: 20, fontWeight: '800', color: '#60a5fa', marginVertical: 5 },
  countLabel: { fontSize: 12, fontWeight: '600', color: '#d1d5db' },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#f3f4f6', marginBottom: 15, letterSpacing: 0.5 },
  progressCard: {
    borderRadius: 15,
    padding: 15,
    marginRight: 15,
    width: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  progressTitle: { fontSize: 16, fontWeight: '600', color: '#f3f4f6', marginBottom: 10 },
  progressContainer: { height: 10, backgroundColor: '#4b5563', borderRadius: 5, overflow: 'hidden', marginBottom: 10 },
  progressBar: { height: '100%', borderRadius: 5 },
  progressText: { fontSize: 14, fontWeight: '600', color: '#d1d5db', textAlign: 'right' },
  progressList: { paddingBottom: 20 },
  priorityCard: {
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  priorityTitle: { fontSize: 16, fontWeight: '600', color: '#f3f4f6', marginBottom: 5 },
  priorityText: { fontSize: 14, fontWeight: '600', color: '#d1d5db' },
  actionGroup: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
  actionButton: {
    width: '45%',
    marginVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  
  buttonGradient: { paddingVertical: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  buttonText: { color: '#fff', fontSize: 14, fontWeight: '600', marginLeft: 5 },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.7)' },
  modalContent: {
    width: '85%',
    padding: 25,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#f3f4f6', marginBottom: 20, textAlign: 'center' },
  modalInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#4b5563',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#f3f4f6',
    backgroundColor: '#2d3748',
    marginBottom: 20,
  },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  modalButton: { width: '48%', borderRadius: 12, overflow: 'hidden' },
  noDataText: { fontSize: 16, fontWeight: '600', color: '#9ca3af', textAlign: 'center', marginVertical: 20 },
  bottomMenuContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#111827', // Match background
  },
});

export default HomeScreen;