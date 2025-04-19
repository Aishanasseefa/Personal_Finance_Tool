import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import ApiProvider from '../config/ApiProvider';

const AdditionalIncomeScreen = ({ route, navigation }) => {
  const { userId } = route.params;
  const [incomeList, setIncomeList] = useState([]);
  const [newIncome, setNewIncome] = useState('');
  const [editIncomeId, setEditIncomeId] = useState(null);
  const [editAmount, setEditAmount] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchIncomeList();
  }, []);

  const fetchIncomeList = async () => {
    try {
      setLoading(true);
      const response = await ApiProvider.getAdditionalIncomeList(userId); // New API method
      setIncomeList(response || []);
    } catch (error) {
      console.error('Error fetching income list:', error);
      alert('Failed to load income list');
    } finally {
      setLoading(false);
    }
  };

  const handleAddIncome = async () => {
    if (!newIncome || isNaN(newIncome) || Number(newIncome) <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    try {
      setLoading(true);
      await ApiProvider.addAdditionalIncome(userId, Number(newIncome));
      setNewIncome('');
      fetchIncomeList();
    } catch (error) {
      alert('Failed to add income: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateIncome = async (id) => {
    if (!editAmount || isNaN(editAmount) || Number(editAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    try {
      setLoading(true);
      await ApiProvider.updateAdditionalIncome(userId, id, Number(editAmount)); // New API method
      setEditIncomeId(null);
      setEditAmount('');
      fetchIncomeList();
    } catch (error) {
      alert('Failed to update income: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteIncome = async (id) => {
    try {
      setLoading(true);
      await ApiProvider.deleteAdditionalIncome(userId, id); // New API method
      fetchIncomeList();
    } catch (error) {
      alert('Failed to delete income: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const renderIncomeItem = ({ item }) => (
    <LinearGradient
      colors={['#2d3748', '#1a202c']}
      style={styles.incomeCard}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {editIncomeId === item.id ? (
        <>
          <TextInput
            style={styles.editInput}
            value={editAmount}
            onChangeText={setEditAmount}
            keyboardType="decimal-pad"
            placeholder="Edit amount"
            placeholderTextColor="#9ca3af"
          />
          <View style={styles.actionRow}>
            <TouchableOpacity onPress={() => handleUpdateIncome(item.id)} disabled={loading}>
              <Icon name="check" size={24} color="#10b981" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setEditIncomeId(null)} disabled={loading}>
              <Icon name="close" size={24} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <>
          <Text style={styles.incomeText}>₹{Number(item.amount)}</Text>
          <View style={styles.actionRow}>
            <TouchableOpacity onPress={() => { setEditIncomeId(item.id); setEditAmount(item.amount.toString()); }} disabled={loading}>
              <Icon name="pencil" size={24} color="#60a5fa" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDeleteIncome(item.id)} disabled={loading}>
              <Icon name="delete" size={24} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </>
      )}
    </LinearGradient>
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
          <Text style={styles.navbarTitle}>Manage Additional Income</Text>
        </LinearGradient>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={newIncome}
            onChangeText={setNewIncome}
            keyboardType="decimal-pad"
            placeholder="Enter new income amount"
            placeholderTextColor="#9ca3af"
          />
          <TouchableOpacity style={styles.addButton} onPress={handleAddIncome} disabled={loading}>
            <LinearGradient colors={['#10b981', '#047857']} style={styles.buttonGradient}>
              <Icon name="plus" size={20} color="#fff" />
              <Text style={styles.buttonText}>Add</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <FlatList
          data={incomeList}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderIncomeItem}
          ListEmptyComponent={<Text style={styles.noDataText}>No additional income entries</Text>}
          contentContainerStyle={styles.listContainer}
        />
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
    paddingTop: 30,
    paddingBottom: 15,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  backButton: { padding: 5 },
  navbarTitle: { fontSize: 22, fontWeight: '700', color: '#f3f4f6', marginLeft: 10 },
  inputContainer: { flexDirection: 'row', padding: 20, alignItems: 'center' },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#4b5563',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#f3f4f6',
    backgroundColor: '#2d3748',
    marginRight: 10,
  },
  addButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonGradient: { paddingVertical: 12, paddingHorizontal: 15, alignItems: 'center', flexDirection: 'row' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600', marginLeft: 5 },
  incomeCard: {
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  incomeText: { fontSize: 18, fontWeight: '600', color: '#f3f4f6', marginBottom: 10 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between' },
  editInput: {
    borderWidth: 1,
    borderColor: '#4b5563',
    borderRadius: 12,
    padding: 10,
    fontSize: 16,
    color: '#f3f4f6',
    backgroundColor: '#2d3748',
    marginBottom: 10,
  },
  listContainer: { paddingBottom: 20 },
  noDataText: { fontSize: 16, fontWeight: '600', color: '#9ca3af', textAlign: 'center', marginVertical: 20 },
});

export default AdditionalIncomeScreen;