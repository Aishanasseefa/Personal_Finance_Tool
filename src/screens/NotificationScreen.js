import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ApiProvider from '../config/ApiProvider';
import { getUserId } from '../config/auth';
import TopNavbar from '../components/TopNavbar';
import BottomMenubar from '../components/BottomMenubar';

const NotificationScreen = ({ route, navigation }) => {
  const [userId, setUserId] = useState(route?.params?.userId || null);
  const [todayNotifications, setTodayNotifications] = useState([]);
  const [previousNotifications, setPreviousNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUserIdAndNotifications = async () => {
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
        const notificationData = await ApiProvider.getNotifications(effectiveUserId);
        groupNotificationsByDate(notificationData);
      } catch (error) {
        console.error('Error fetching notifications:', error);
        alert('Failed to load notifications: ' + error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchUserIdAndNotifications();
  }, [userId, navigation]);

  const groupNotificationsByDate = (data) => {
    // Use local date instead of UTC
    const today = new Date();
    const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    console.log('Today (local):', todayString); // Debug log

    const todayItems = [];
    const previousItems = [];

    (Array.isArray(data) ? data : []).forEach((item) => {
      const itemDate = new Date(item.date);
      const itemDateString = `${itemDate.getFullYear()}-${String(itemDate.getMonth() + 1).padStart(2, '0')}-${String(itemDate.getDate()).padStart(2, '0')}`;
      console.log(`Item date (local): ${itemDateString}, Original: ${item.date}`); // Debug log

      if (itemDateString === todayString) {
        todayItems.push(item);
      } else {
        previousItems.push(item);
      }
    });

    setTodayNotifications(todayItems);
    setPreviousNotifications(previousItems.sort((a, b) => new Date(b.date) - new Date(a.date))); // Sort previous by date, newest first
  };

  const renderNotification = ({ item, index, section }) => (
    <LinearGradient
      colors={section === 'today' ? ['#2f855a', '#1a4731'] : ['#2d3748', '#1a202c']}
      style={styles.notificationItem}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.notificationContent}>
        <Text style={styles.amountText}>₹{item.amount || 'N/A'}</Text>
        <Text style={styles.categoryText}>{item.category || 'General'}</Text>
        <Text style={styles.detailsText}>{item.details || 'No details provided'}</Text>
        <Text style={styles.dateText}>{new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
        <View style={section === 'today' ? styles.liveBadge : styles.completedBadge}>
          <Text style={styles.badgeText}>{section === 'today' ? 'Live' : 'Completed'}</Text>
        </View>
      </View>
    </LinearGradient>
  );

  const renderSectionHeader = (title, count) => (
    <Text style={styles.sectionHeader}>{`${title} (${count})`}</Text>
  );

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.container}>
        <TopNavbar username={route?.params?.user?.username || 'User'} navigation={navigation} />
        <View style={styles.content}>
          {loading ? (
            <Text style={styles.loadingText}>Loading...</Text>
          ) : todayNotifications.length === 0 && previousNotifications.length === 0 ? (
            <Text style={styles.noDataText}>No notifications available</Text>
          ) : (
            <FlatList
              data={[
                ...(todayNotifications.length > 0 ? [{ id: 'today-header', isHeader: true }, ...todayNotifications] : []),
                ...(previousNotifications.length > 0 ? [{ id: 'previous-header', isHeader: true }, ...previousNotifications] : []),
              ]}
              keyExtractor={(item) => (item.isHeader ? item.id : item.id?.toString() || Math.random().toString())}
              renderItem={({ item, index }) => {
                if (item.isHeader) {
                  return renderSectionHeader(
                    item.id === 'today-header' ? 'Today' : 'Previous',
                    item.id === 'today-header' ? todayNotifications.length : previousNotifications.length
                  );
                }
                return renderNotification({
                  item,
                  index,
                  section: index <= todayNotifications.length ? 'today' : 'previous',
                });
              }}
              contentContainerStyle={styles.listContainer}
            />
          )}
        </View>
        <BottomMenubar navigation={navigation} userId={userId} activeRoute="Notifications" />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#1a202c',
  },
  container: {
    flex: 1,
    backgroundColor: '#1a202c',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: '#e5e7eb',
    marginBottom: 15,
    marginTop: 20,
    letterSpacing: 0.5,
  },
  notificationItem: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
    minHeight: 40,
  },
  notificationContent: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    position: 'relative',
  },
  amountText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#60a5fa',
    marginBottom: 6,
  },
  categoryText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#d1d5db',
    marginBottom: 1,
  },
  detailsText: {
    fontSize: 16,
    color: '#a0aec0',
    fontWeight: '500',
    lineHeight: 22,
    marginBottom: 8,
  },
  dateText: {
    fontSize: 14,
    color: '#a0aec0',
    fontWeight: '600',
  },
  liveBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#48bb78',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  completedBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#4a5568',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  badgeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '700',
  },
  loadingText: {
    fontSize: 18,
    color: '#a0aec0',
    textAlign: 'center',
    marginTop: 30,
    fontWeight: '600',
  },
  noDataText: {
    fontSize: 18,
    color: '#a0aec0',
    textAlign: 'center',
    marginTop: 30,
    fontWeight: '600',
  },
  listContainer: {
    paddingBottom: 20,
  },
});

export default NotificationScreen;