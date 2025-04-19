import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, Modal, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import ApiProvider from '../config/ApiProvider';

const OnlinePaymentScreen = ({ route, navigation }) => {
  const { userId } = route.params;
  const [amount, setAmount] = useState('');
  const [upiId, setUpiId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [filterCategoryId, setFilterCategoryId] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmationVisible, setConfirmationVisible] = useState(false);
  const [isFormExpanded, setIsFormExpanded] = useState(true); // Form collapse state

  useEffect(() => {
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
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId]);

  const handlePayment = async () => {
    if (!amount || isNaN(amount) || Number(amount) <= 0 || !upiId || !categoryId) {
      alert('Please enter a valid amount, UPI ID, and select a category');
      return;
    }
    setConfirmationVisible(true);
  };

  const confirmPayment = async () => {
    try {
      setLoading(true);
      await ApiProvider.addExpense(userId, {
        category_id: categoryId,
        amount: Number(amount),
        details: `UPI Payment to ${upiId}`,
        source: 'online',
      });
      const updatedExpenses = await ApiProvider.getExpenses(userId);
      setExpenses(updatedExpenses);
      setAmount('');
      setUpiId('');
      setCategoryId('');
      alert('Payment Successful!');
    } catch (error) {
      alert('Failed to process payment: ' + error);
    } finally {
      setLoading(false);
      setConfirmationVisible(false);
    }
  };

  const simulateQRScan = () => {
    // Generate random dummy data
    const dummyNames = ['john.doe', 'jane.smith', 'alex.lee', 'mary.jones', 'sam.brown'];
    const dummyBanks = ['upi', 'paytm', 'gpay', 'phonepe', 'sbi'];
    const randomName = dummyNames[Math.floor(Math.random() * dummyNames.length)];
    const randomBank = dummyBanks[Math.floor(Math.random() * dummyBanks.length)];
    const dummyUpiId = `${randomName}@${randomBank}`;
    const dummyAmount = (Math.random() * 1000 + 50).toFixed(2); // Random amount between 50 and 1050
    const dummyCategoryId = categories.length > 0 ? categories[Math.floor(Math.random() * categories.length)].id : '1';

    setUpiId(dummyUpiId);
    setAmount(dummyAmount);
    setCategoryId(dummyCategoryId);
    alert(`Filled with dummy data (not scanning QR): ${dummyUpiId}, ₹${dummyAmount}, Category: ${categories.find(cat => cat.id === dummyCategoryId)?.category_name || 'Unknown'}`);
  };

  const toggleForm = () => setIsFormExpanded(!isFormExpanded);

  const data = [
    { type: 'form', id: 'form' },
    { type: 'scan', id: 'scan' },
    { type: 'filter', id: 'filter' },
    ...(expenses
      .filter(exp => exp.source === 'online' && (!filterCategoryId || exp.category_id === filterCategoryId))
      .map(exp => ({ type: 'expense', ...exp }))),
  ];

  const renderItem = ({ item }) => {
    if (item.type === 'form') {
      return (
        <LinearGradient
          colors={['#374151', '#1f2937']}
          style={styles.paymentCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <TouchableOpacity style={styles.formHeader} onPress={toggleForm}>
            <Text style={styles.sectionTitle}>Make a Payment</Text>
            <Icon
              name={isFormExpanded ? 'chevron-up' : 'chevron-down'}
              size={24}
              color="#f3f4f6"
            />
          </TouchableOpacity>
          {isFormExpanded && (
            <View style={styles.formContent}>
              <Text style={styles.label}>To (UPI ID)</Text>
              <TextInput
                style={styles.input}
                value={upiId}
                onChangeText={setUpiId}
                placeholder="e.g., name@upi"
                placeholderTextColor="#9ca3af"
              />
              <Text style={styles.label}>Amount</Text>
              <TextInput
                style={styles.input}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                placeholder="₹0.00"
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
                style={styles.payButton}
                onPress={handlePayment}
                disabled={loading}
              >
                <LinearGradient
                  colors={['#10b981', '#047857']}
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.buttonText}>{loading ? 'Processing...' : `Pay ₹${amount || '0.00'}`}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </LinearGradient>
      );
    } else if (item.type === 'scan') {
      return (
        <TouchableOpacity style={styles.scanButton} onPress={simulateQRScan}>
          <LinearGradient
            colors={['#3498db', '#1e40af']}
            style={styles.scanButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Icon name="qrcode" size={40} color="#f3f4f6" />
            <Text style={styles.scanButtonText}>Scan QR Code</Text>
          </LinearGradient>
        </TouchableOpacity>
      );
    } else if (item.type === 'filter') {
      return (
        <View style={styles.filterSection}>
          <Text style={styles.subtitle}>Filter Payments by Category</Text>
          <FlatList
            data={[{ id: '', category_name: 'All' }, ...categories]}
            keyExtractor={(cat) => cat.id.toString()}
            renderItem={({ item: cat }) => (
              <TouchableOpacity
                style={[
                  styles.categoryItem,
                  filterCategoryId === cat.id && styles.selectedCategory,
                ]}
                onPress={() => setFilterCategoryId(cat.id)}
              >
                <Text style={[
                  styles.categoryText,
                  filterCategoryId === cat.id && styles.selectedCategoryText,
                ]}>
                  {cat.category_name}
                </Text>
              </TouchableOpacity>
            )}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryList}
          />
        </View>
      );
    } else if (item.type === 'expense') {
      return (
        <LinearGradient
          colors={['#2d3748', '#1a202c']}
          style={styles.historyItem}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.historyHeader}>
            <Text style={styles.historyAmount}>₹{item.amount}</Text>
            <View style={styles.categoryFlag}>
              <Text style={styles.categoryFlagText}>
                {categories.find(cat => cat.id === item.category_id)?.category_name || item.category_id}
              </Text>
            </View>
          </View>
          <Text style={styles.historyDetails}>{item.details || 'No details'}</Text>
          <Text style={styles.historyDate}>
            {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </Text>
        </LinearGradient>
      );
    }
    return null;
  };

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
          <Text style={styles.navbarTitle}>UPI Payment</Text>
        </LinearGradient>

        {loading && expenses.length === 0 ? (
          <Text style={styles.loadingText}>Loading...</Text>
        ) : (
          <FlatList
            data={data}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.flatListContent}
            ListEmptyComponent={<Text style={styles.noDataText}>No online payments yet</Text>}
          />
        )}

        {/* Confirmation Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={confirmationVisible}
          onRequestClose={() => setConfirmationVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <LinearGradient
              colors={['#374151', '#1f2937']}
              style={styles.modalContent}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.modalTitle}>Confirm Payment</Text>
              <Text style={styles.modalText}>To: {upiId}</Text>
              <Text style={styles.modalText}>Amount: ₹{amount}</Text>
              <Text style={styles.modalText}>Category: {categories.find(cat => cat.id === categoryId)?.category_name || 'Unknown'}</Text>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={confirmPayment}
                disabled={loading}
              >
                <LinearGradient
                  colors={['#10b981', '#047857']}
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.buttonText}>{loading ? 'Processing...' : 'Confirm'}</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setConfirmationVisible(false)}
              >
                <LinearGradient
                  colors={['#ef4444', '#b91c1c']}
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
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
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    paddingTop:30
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
  paymentCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f3f4f6',
    letterSpacing: 0.5,
  },
  formContent: {
    marginTop: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: '#d1d5db',
    marginBottom: 8,
  },
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
  categoryList: {
    marginBottom: 20,
  },
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
  selectedCategory: {
    backgroundColor: '#60a5fa',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#d1d5db',
  },
  selectedCategoryText: {
    color: '#fff',
  },
  payButton: {
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  scanButton: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  scanButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 30,
  },
  scanButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f3f4f6',
    marginLeft: 10,
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
  filterSection: {
    marginBottom: 25,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f3f4f6',
    marginBottom: 15,
    letterSpacing: 0.5,
  },
  historyItem: {
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f3f4f6',
  },
  categoryFlag: {
    backgroundColor: '#60a5fa',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  categoryFlagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  historyDetails: {
    fontSize: 16,
    fontWeight: '600',
    color: '#d1d5db',
    marginBottom: 8,
  },
  historyDate: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9ca3af',
    textAlign: 'right',
  },
  noDataText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9ca3af',
    textAlign: 'center',
    marginVertical: 20,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 30,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    borderRadius: 20,
    padding: 20,
    width: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#f3f4f6',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#d1d5db',
    marginBottom: 10,
    textAlign: 'center',
  },
  confirmButton: {
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 10,
    width: '100%',
  },
  cancelButton: {
    borderRadius: 15,
    overflow: 'hidden',
    width: '100%',
  },
});

export default OnlinePaymentScreen;