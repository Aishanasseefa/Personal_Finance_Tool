// src/config/ApiProvider.js
import axios from 'axios';
import API_URL from './config';

const ApiProvider = {
  // Fetch user data (including salary)
  getUser: async (userId) => {
    try {
      const response = await axios.get(`${API_URL}/user/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Get user error:', error.response?.data || error.message);
      throw error.response?.data?.error || 'Failed to fetch user data';
    }
  },

  updateUser: async (userId, data) => {
    try {
      const response = await axios.put(`${API_URL}/user/${userId}`, data);
      return response.data;
    } catch (error) {
      console.error('Update user error:', error.response?.data || error.message);
      throw error.response?.data?.error || 'Failed to update user';
    }
  },

  // Update user salary
  updateSalary: async (userId, salary) => {
    try {
      const response = await axios.put(`${API_URL}/user/${userId}/salary`, { salary });
      return response.data;
    } catch (error) {
      console.error('Update salary error:', error.response?.data || error.message);
      throw error.response?.data?.error || 'Failed to update salary';
    }
  },

  getUserExpenses: async (userId) => {
    try {
        return "success"
    //   const response = await axios.get(`${API_URL}/user/${userId}/expenses`);
    //   return response.data;
    } catch (error) {
      console.error('Get expenses error:', error.response?.data || error.message);
      throw error.response?.data?.error || 'Failed to fetch expenses';
    }
  },

  addAdditionalIncome: async (userId, amount) => {
    try {
      const response = await axios.post(`${API_URL}/user/${userId}/additional-income`, { amount });
      return response.data;
    } catch (error) {
      console.error('Add income error:', error.response?.data || error.message);
      throw error.response?.data?.error || 'Failed to add additional income';
    }
  },
  getCategories: async () => {
    try {
      const response = await axios.get(`${API_URL}/category`);
      return response.data;
    } catch (error) {
      console.error('Get categories error:', error.response?.data || error.message);
      throw error.response?.data?.error || 'Failed to fetch categories';
    }
  },

  addExpense: async (userId, expenseData) => {
    try {
      const response = await axios.post(`${API_URL}/expense/${userId}`, expenseData);
      return response.data;
    } catch (error) {
      console.error('Add expense error:', error.response?.data || error.message);
      throw error.response?.data?.error || 'Failed to add expense';
    }
  },

  addExpense: async (userId, expenseData) => {
    try {
      const response = await axios.post(`${API_URL}/expense/${userId}`, expenseData);
      return response.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to add expense';
    }
  },

  getExpenses: async (userId) => {
    try {
      const response = await axios.get(`${API_URL}/expense/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch expenses';
    }
  },

  updateExpense: async (userId, expenseId, expenseData) => {
    try {
      const response = await axios.put(`${API_URL}/expense/${userId}`, expenseData);
      return response.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to update expense';
    }
  },

  deleteExpense: async (userId, expenseId) => {
    try {
      const response = await axios.delete(`${API_URL}/expense/${userId}`, {
        params: { expense_id: expenseId },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to delete expense';
    }
  },

  getExpenses: async (userId) => {
    try {
      const response = await axios.get(`${API_URL}/expense/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Get expenses error:', error.response?.data || error.message);
      throw error.response?.data?.error || 'Failed to fetch expenses';
    }
  },
  getPriorities: async (userId) => {
    try {
      const response = await axios.get(`${API_URL}/priority/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Get priorities error:', error.response?.data || error.message);
      throw error.response?.data?.error || 'Failed to fetch priorities';
    }
  },

  addPriority: async (userId, data) => {
    try {
      const response = await axios.post(`${API_URL}/priority/${userId}`, data);
      return response.data;
    } catch (error) {
      console.error('Add priority error:', error.response?.data || error.message);
      throw error.response?.data?.error || 'Failed to add priority';
    }
  },

  updatePriority: async (userId, data) => {
    try {
      const response = await axios.put(`${API_URL}/priority/${userId}`, data);
      return response.data;
    } catch (error) {
      console.error('Update priority error:', error.response?.data || error.message);
      throw error.response?.data?.error || 'Failed to update priority';
    }
  },

  deletePriority: async (userId, data) => {
    try {
      const response = await axios.delete(`${API_URL}/priority/${userId}`, { data });
      return response.data;
    } catch (error) {
      console.error('Delete priority error:', error.response?.data || error.message);
      throw error.response?.data?.error || 'Failed to delete priority';
    }
  },

  getNotifications: async (userId) => {
    try {
      const response = await axios.get(`${API_URL}/notifications/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Get notifications error:', error.response?.data || error.message);
      throw error.response?.data?.error || 'Failed to fetch notifications';
    }
  },
  addSuggestion: async (userId) => {
    try {
      const response = await axios.post(`${API_URL}/suggestion/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to generate suggestions';
    }
  },
  getSuggestions: async (userId) => {
    try {
      const response = await axios.get(`${API_URL}/suggestion/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch suggestions';
    }
  },
  verifyPassword: async (userId, oldPassword) => {
    try {
      const response = await axios.post(`${API_URL}/user/${userId}/verify-password`, { password: oldPassword });
      return response.data.isValid;
    } catch (error) {
      console.error('Verify password error:', error.response?.data || error.message);
      throw error.response?.data?.error || 'Failed to verify password';
    }
  },

  getProgressBar: async (userId) => {
    try {
      const response = await fetch(`${API_URL}/progressbar/${userId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      return data; 
    } catch (error) {
      console.error('Error fetching progress bar data:', error);
      throw error;
    }
  },

  getUser: async (userId) => {
    try {
      const response = await axios.get(`${API_URL}/user/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch user data';
    }
  },

  updateSalary: async (userId, salary) => {
    try {
      const response = await axios.put(`${API_URL}/user/${userId}/salary`, { salary });
      return response.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to update salary';
    }
  },

  getUserExpenses: async (userId) => {
    try {
      const response = await axios.get(`${API_URL}/user/${userId}/expenses`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch expenses';
    }
  },

  addAdditionalIncome: async (userId, amount) => {
    try {
      const response = await axios.post(`${API_URL}/user/${userId}/additional-income`, { amount });
      return response.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to add additional income';
    }
  },

  getAdditionalIncomeSum: async (userId) => {
    try {
      const response = await axios.get(`${API_URL}/user/${userId}/additional-income-sum`, {
        params: { month: new Date().toISOString().slice(0, 7) }, // e.g., "2025-03"
      });
      return response.data.sum || 0;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch additional income sum';
    }
  },

  getExpenses: async (userId) => {
    try {
      const response = await axios.get(`${API_URL}/expense/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch expenses';
    }
  },

  getPriorities: async (userId) => {
    try {
      const response = await axios.get(`${API_URL}/priority/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch priorities';
    }
  },

  getProgressBar: async (userId) => {
    try {
      const response = await axios.get(`${API_URL}/progressbar/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch progress bar data';
    }
  },

  getMonthlyExpenseTrends: async (userId) => {
    try {
      const response = await axios.get(`${API_URL}/expense/${userId}/trends`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch expense trends';
    }
  },


  getUserSummary: async (userId) => {
    try {
      const response = await axios.get(`${API_URL}/user/${userId}/summary`);
      return response.data;
    } catch (error) {
      console.error('Get user summary error:', error.response?.data || error.message);
      throw error.response?.data?.error || 'Failed to fetch user summary';
    }
  },

  getAdditionalIncomeSum: async (userId) => {
    try {
      const response = await axios.get(`${API_URL}/user/${userId}/additional-income-sum`, {
        params: { month: new Date().toISOString().slice(0, 7) },
      });
      return response.data.sum || 0;
    } catch (error) {
      console.error('Get additional income sum error:', error.response?.data || error.message);
      throw error.response?.data?.error || 'Failed to fetch additional income sum';
    }
  },

  getExpensesByCategory: async (userId) => {
    try {
      const response = await axios.get(`${API_URL}/expense/${userId}/by-category`);
      return response.data;
    } catch (error) {
      console.error('Get expenses by category error:', error.response?.data || error.message);
      throw error.response?.data?.error || 'Failed to fetch expenses by category';
    }
  },

  getPriorityVsSpending: async (userId) => {
    try {
      const response = await axios.get(`${API_URL}/priority/${userId}/vs-spending`);
      return response.data;
    } catch (error) {
      console.error('Get priority vs spending error:', error.response?.data || error.message);
      throw error.response?.data?.error || 'Failed to fetch priority vs spending';
    }
  },

  getMonthlyExpenseTrends: async (userId) => {
    try {
      const response = await axios.get(`${API_URL}/expense/${userId}/trends`);
      return response.data;
    } catch (error) {
      console.error('Get expense trends error:', error.response?.data || error.message);
      throw error.response?.data?.error || 'Failed to fetch expense trends';
    }
  },

  getAdditionalIncomeList: async (userId) => {
    try {
      const response = await axios.get(`${API_URL}/user/${userId}/additional-income-list`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch income list';
    }
  },

  updateAdditionalIncome: async (userId, incomeId, amount) => {
    try {
      const response = await axios.put(`${API_URL}/user/${userId}/additional-income/${incomeId}`, { amount });
      return response.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to update income';
    }
  },

  deleteAdditionalIncome: async (userId, incomeId) => {
    try {
      const response = await axios.delete(`${API_URL}/user/${userId}/additional-income/${incomeId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to delete income';
    }
  },

};

export default ApiProvider;