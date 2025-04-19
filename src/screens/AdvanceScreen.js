import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, Modal, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar } from 'react-native-calendars';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import ApiProvider from '../config/ApiProvider';

const AdvanceScreen = ({ route, navigation }) => {
  const { userId } = route.params;
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [details, setDetails] = useState('');
  const [categories, setCategories] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [isCalendarExpanded, setIsCalendarExpanded] = useState(true);
  const [editExpenseId, setEditExpenseId] = useState(null);
  const [editAmount, setEditAmount] = useState('');
  const [editDetails, setEditDetails] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');

  useEffect(() => {
    fetchData();
  }, [userId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [catData, expData] = await Promise.all([
        ApiProvider.getCategories(),
        ApiProvider.getExpenses(userId),
      ]);
      setCategories(Array.isArray(catData) ? catData : []);
      setExpenses(expData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Failed to load data: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async () => {
    if (!amount || !categoryId || !selectedDate || isNaN(amount) || Number(amount) <= 0) {
      alert('Please enter a valid amount, select a category, and pick a date');
      return;
    }
    try {
      setLoading(true);
      await ApiProvider.addExpense(userId, {
        category_id: categoryId,
        amount: Number(amount),
        details,
        source: 'advance',
        date: selectedDate,
      });
      await fetchData();
      setAmount('');
      setDetails('');
      setCategoryId('');
      setModalVisible(false);
    } catch (error) {
      console.error('Error adding expense:', error);
      alert('Failed to add expense: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateExpense = async (id) => {
    if (!editAmount || !editCategoryId || isNaN(editAmount) || Number(editAmount) <= 0) {
      alert('Please enter a valid amount and select a category');
      return;
    }
    try {
      setLoading(true);
      await ApiProvider.updateExpense(userId, id, {
        expense_id: id,
        category_id: editCategoryId,
        amount: Number(editAmount),
        details: editDetails,
        source: 'advance',
        date: selectedDate,
      });
      await fetchData();
      setEditExpenseId(null);
      setEditAmount('');
      setEditDetails('');
      setEditCategoryId('');
      alert('Expense updated successfully');
    } catch (error) {
      console.error('Error updating expense:', error);
      alert('Failed to update expense: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExpense = async (id) => {
    try {
      setLoading(true);
      await ApiProvider.deleteExpense(userId, id);
      await fetchData();
      alert('Expense deleted successfully');
    } catch (error) {
      console.error('Error deleting expense:', error);
      alert('Failed to delete expense: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCalendar = () => setIsCalendarExpanded(!isCalendarExpanded);

  const filteredExpenses = expenses.filter(
    exp => exp.source === 'advance' && exp.date === selectedDate
  );

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
          <Text style={styles.navbarTitle}>Advance Expenses</Text>
        </LinearGradient>

        {loading && expenses.length === 0 ? (
          <Text style={styles.loadingText}>Loading...</Text>
        ) : (
          <FlatList
            data={[
              { type: 'calendar', id: 'calendar' },
              ...filteredExpenses.map(exp => ({ type: 'expense', ...exp })),
            ]}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => {
              if (item.type === 'calendar') {
                return (
                  <LinearGradient
                    colors={['#374151', '#1f2937']}
                    style={styles.calendarContainer}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <TouchableOpacity style={styles.calendarHeader} onPress={toggleCalendar}>
                      <Text style={styles.subtitle}>Select Date</Text>
                      <Icon
                        name={isCalendarExpanded ? 'chevron-up' : 'chevron-down'}
                        size={24}
                        color="#f3f4f6"
                      />
                    </TouchableOpacity>
                    {isCalendarExpanded && (
                      <View style={styles.calendarContent}>
                        <Calendar
                          onDayPress={(day) => setSelectedDate(day.dateString)}
                          markedDates={{ [selectedDate]: { selected: true, selectedColor: '#60a5fa' } }}
                          style={styles.calendar}
                          theme={{
                            backgroundColor: '#1f2937',
                            calendarBackground: '#1f2937',
                            textSectionTitleColor: '#d1d5db',
                            selectedDayBackgroundColor: '#60a5fa',
                            selectedDayTextColor: '#fff',
                            todayTextColor: '#60a5fa',
                            dayTextColor: '#f3f4f6',
                            textDisabledColor: '#4b5563',
                            monthTextColor: '#f3f4f6',
                            arrowColor: '#60a5fa',
                          }}
                        />
                        <TouchableOpacity
                          style={styles.addButton}
                          onPress={() => setModalVisible(true)}
                        >
                          <LinearGradient
                            colors={['#10b981', '#047857']}
                            style={styles.buttonGradient}
                          >
                            <Icon name="plus" size={24} color="#fff" />
                            <Text style={styles.buttonText}>Future Expense</Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      </View>
                    )}
                  </LinearGradient>
                );
              } else if (item.type === 'expense') {
                const isEditing = editExpenseId === item.id;
                return (
                  <LinearGradient
                    colors={['#2d3748', '#1a202c']}
                    style={styles.expenseItem}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    {isEditing ? (
                      <View style={styles.editContainer}>
                        <TextInput
                          style={styles.editInput}
                          value={editAmount}
                          onChangeText={setEditAmount}
                          keyboardType="decimal-pad"
                          placeholder="Amount"
                          placeholderTextColor="#9ca3af"
                        />
                        <TextInput
                          style={styles.editInput}
                          value={editDetails}
                          onChangeText={setEditDetails}
                          placeholder="Details"
                          placeholderTextColor="#9ca3af"
                        />
                        <FlatList
                          data={categories}
                          keyExtractor={(cat) => cat.id.toString()}
                          renderItem={({ item: cat }) => (
                            <TouchableOpacity
                              style={[
                                styles.categoryItem,
                                editCategoryId === cat.id && styles.selectedCategory,
                              ]}
                              onPress={() => setEditCategoryId(cat.id)}
                            >
                              <Text style={[
                                styles.categoryText,
                                editCategoryId === cat.id && styles.selectedCategoryText,
                              ]}>
                                {cat.category_name}
                              </Text>
                            </TouchableOpacity>
                          )}
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          style={styles.categoryList}
                        />
                        <View style={styles.actionRow}>
                          <TouchableOpacity
                            onPress={() => handleUpdateExpense(item.id)}
                            disabled={loading}
                          >
                            <Icon name="check" size={24} color="#10b981" />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => setEditExpenseId(null)}
                            disabled={loading}
                          >
                            <Icon name="close" size={24} color="#ef4444" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <>
                        <View style={styles.expenseHeader}>
                          <Text style={styles.expenseAmount}>₹{item.amount}</Text>
                          <View style={styles.categoryFlag}>
                            <Text style={styles.categoryFlagText}>
                              {categories.find(cat => cat.id === item.category_id)?.category_name || item.category_id}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.expenseDetails}>{item.details || 'No details'}</Text>
                        <View style={styles.expenseFooter}>
                          <Text style={styles.expenseDate}>
                            {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </Text>
                          <View style={styles.actionButtons}>
                            <TouchableOpacity
                              onPress={() => {
                                setEditExpenseId(item.id);
                                setEditAmount(item.amount.toString());
                                setEditDetails(item.details || '');
                                setEditCategoryId(item.category_id);
                              }}
                              disabled={loading}
                            >
                              <Icon name="pencil" size={20} color="#60a5fa" />
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => handleDeleteExpense(item.id)}
                              disabled={loading}
                            >
                              <Icon name="delete" size={20} color="#ef4444" style={{ marginLeft: 10 }} />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </>
                    )}
                  </LinearGradient>
                );
              }
              return null;
            }}
            contentContainerStyle={styles.flatListContent}
            ListEmptyComponent={
              selectedDate ? (
                <Text style={styles.noDataText}>No advance expenses for {selectedDate}</Text>
              ) : (
                <Text style={styles.noDataText}>Select a date to view or add expenses</Text>
              )
            }
          />
        )}

        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <LinearGradient
              colors={['#374151', '#1f2937']}
              style={styles.modalContent}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.modalTitle}>Add Future Expense</Text>
              <Text style={styles.modalText}>Date: {selectedDate}</Text>
              <Text style={styles.label}>Amount</Text>
              <TextInput
                style={styles.input}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                placeholder="₹0.00"
                placeholderTextColor="#9ca3af"
              />
              <Text style={styles.label}>Details</Text>
              <TextInput
                style={styles.input}
                value={details}
                onChangeText={setDetails}
                placeholder="Add details"
                placeholderTextColor="#9ca3af"
              />
              <Text style={styles.label}>Category</Text>
              {categories.length === 0 ? (
                <Text style={styles.noDataText}>No categories available</Text>
              ) : (
                <FlatList
                  data={categories}
                  keyExtractor={(cat) => cat.id.toString()}
                  renderItem={({ item: cat }) => (
                    <TouchableOpacity
                      style={[
                        styles.categoryItem,
                        categoryId === cat.id && styles.selectedCategory,
                      ]}
                      onPress={() => setCategoryId(cat.id)}
                    >
                      <Text style={[
                        styles.categoryText,
                        categoryId === cat.id && styles.selectedCategoryText,
                      ]}>
                        {cat.category_name}
                      </Text>
                    </TouchableOpacity>
                  )}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.categoryList}
                />
              )}
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleAddExpense}
                disabled={loading}
              >
                <LinearGradient
                  colors={['#10b981', '#047857']}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.buttonText}>{loading ? 'Saving...' : 'Save'}</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <LinearGradient
                  colors={['#ef4444', '#b91c1c']}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </Modal>
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
    paddingTop: 30,
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
  navbarTitle: { fontSize: 22, fontWeight: '700', color: '#f3f4f6', letterSpacing: 0.5 },
  flatListContent: { padding: 20, paddingBottom: 20 },
  calendarContainer: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  subtitle: { fontSize: 20, fontWeight: '700', color: '#f3f4f6', letterSpacing: 0.5 },
  calendarContent: { alignItems: 'center' },
  calendar: {
    width: 350,
    height: 390,
    borderRadius: 15,
    backgroundColor: '#1f2937',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  addButton: {
    borderRadius: 15,
    overflow: 'hidden',
    marginTop: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  expenseItem: {
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  expenseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  expenseAmount: { fontSize: 20, fontWeight: '700', color: '#f3f4f6' },
  categoryFlag: {
    backgroundColor: '#60a5fa',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  categoryFlagText: { fontSize: 12, fontWeight: '600', color: '#fff' },
  expenseDetails: { fontSize: 16, fontWeight: '600', color: '#d1d5db', marginBottom: 8 },
  expenseFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  actionButtons: { flexDirection: 'row', alignItems: 'center' },
  editContainer: { paddingVertical: 5 },
  editInput: {
    borderWidth: 1,
    borderColor: '#4b5563',
    borderRadius: 12,
    padding: 10,
    fontSize: 16,
    color: '#f3f4f6',
    backgroundColor: '#1f2937',
    marginBottom: 10,
  },
  actionRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10, gap: 15 },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: { fontSize: 24, fontWeight: '700', color: '#f3f4f6', marginBottom: 15, textAlign: 'center', letterSpacing: 0.5 },
  modalText: { fontSize: 16, fontWeight: '600', color: '#d1d5db', marginBottom: 10, textAlign: 'center' },
  label: { fontSize: 16, fontWeight: '700', color: '#d1d5db', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#4b5563',
    borderRadius: 15,
    padding: 14,
    fontSize: 16,
    color: '#f3f4f6',
    backgroundColor: '#1f2937',
    marginBottom: 20,
  },
  categoryList: { marginBottom: 20 },
  categoryItem: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#2d3748',
    borderRadius: 12,
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  selectedCategory: { backgroundColor: '#60a5fa' },
  categoryText: { fontSize: 14, fontWeight: '600', color: '#d1d5db' },
  selectedCategoryText: { color: '#fff' },
  saveButton: {
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  cancelButton: {
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  buttonGradient: { paddingVertical: 10, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', paddingHorizontal: 30 },
  buttonText: { color: '#fff', fontSize: 14, fontWeight: '700', marginLeft: 5 },
  noDataText: { fontSize: 16, fontWeight: '600', color: '#9ca3af', textAlign: 'center', marginVertical: 20 },
  loadingText: { fontSize: 18, fontWeight: '600', color: '#9ca3af', textAlign: 'center', marginTop: 30 },
});

export default AdvanceScreen;