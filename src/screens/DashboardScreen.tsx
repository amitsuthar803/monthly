import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import {emiDataStore} from '../data/emiData';
import {useNavigation} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {emisCollection} from '../config/firebase';
import type {RootTabScreenProps} from '../types/navigation';
import type {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import type {RootTabParamList} from '../types/navigation';

const DashboardScreen = () => {
  const navigation = useNavigation<BottomTabNavigationProp<RootTabParamList>>();
  const [loading, setLoading] = useState(true);
  const [upcomingEMIs, setUpcomingEMIs] = useState(
    emiDataStore.getUpcomingEMIs() || [],
  );
  const [totalMonthlyEMI, setTotalMonthlyEMI] = useState(
    emiDataStore.getTotalMonthlyEMI() || 0,
  );

  useEffect(() => {
    const unsubscribe = emisCollection.onSnapshot(
      snapshot => {
        try {
          snapshot.docChanges().forEach(change => {
            const emiData = change.doc.data();
            const emi = {id: change.doc.id, ...emiData};

            if (change.type === 'added' || change.type === 'modified') {
              emiDataStore.updateLocalEMI(emi);
            } else if (change.type === 'removed') {
              emiDataStore.removeLocalEMI(emi.id);
            }
          });

          const newUpcomingEMIs = emiDataStore.getUpcomingEMIs() || [];
          const newTotalMonthlyEMI = emiDataStore.getTotalMonthlyEMI() || 0;

          setUpcomingEMIs(newUpcomingEMIs);
          setTotalMonthlyEMI(newTotalMonthlyEMI);
        } catch (error) {
          console.error('Error processing EMI updates:', error);
          setUpcomingEMIs([]);
          setTotalMonthlyEMI(0);
        } finally {
          setLoading(false);
        }
      },
      error => {
        console.error('Error listening to EMIs:', error);
        setLoading(false);
        setUpcomingEMIs([]);
        setTotalMonthlyEMI(0);
      },
    );

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E1F28" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Good evening</Text>
            <Text style={styles.userName}>Alex</Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('AddEMI' as never)}>
            <Icon name="plus-circle-outline" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Total EMI Card */}
      <View style={styles.totalEmiCard}>
        <View style={styles.totalEmiContent}>
          <Text style={styles.totalEmiLabel}>Total Monthly EMI</Text>
          <Text style={styles.totalEmiAmount}>
            ₹{totalMonthlyEMI.toLocaleString('en-IN')}
          </Text>
          <View style={styles.emiStats}>
            <View style={styles.emiStat}>
              <Text style={styles.emiStatLabel}>Active EMIs</Text>
              <Text style={styles.emiStatValue}>{upcomingEMIs.length}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* EMI List */}
      <ScrollView style={styles.emiList}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming EMIs</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('All EMIs')}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        {upcomingEMIs.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="bank-off" size={48} color="#8E8E93" />
            <Text style={styles.emptyStateText}>No upcoming EMIs</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate('AddEMI' as never)}>
              <Text style={styles.addButtonText}>Add New EMI</Text>
            </TouchableOpacity>
          </View>
        ) : (
          upcomingEMIs.map(emi => (
            <TouchableOpacity
              key={emi.id}
              onPress={() =>
                navigation.navigate(
                  'EMIDetails' as never,
                  {emiId: emi.id} as never,
                )
              }
              style={styles.emiCard}>
              <View style={styles.cardIcon}>
                <Icon name="bank" size={24} color="#fff" />
              </View>
              <View style={styles.emiInfo}>
                <View style={styles.emiDetails}>
                  <Text style={styles.emiName}>{emi.name}</Text>
                  <Text style={styles.emiDate}>
                    Next:{' '}
                    {new Date(emi.nextPaymentDate).toLocaleDateString('en-IN')}
                  </Text>
                </View>
                <View style={styles.emiAmount}>
                  <Text style={styles.amount}>
                    ₹{emi.emiAmount.toLocaleString('en-IN')}
                  </Text>
                  <Text style={styles.emiProgress}>
                    EMI {emi.currentEMI + 1} of {emi.tenure}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1F28',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#1E1F28',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#2A2C36',
    padding: 20,
    paddingTop: 40,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    color: '#8E8E93',
    fontSize: 16,
  },
  userName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  totalEmiCard: {
    backgroundColor: '#2A2C36',
    marginHorizontal: 20,
    marginTop: -20,
    borderRadius: 16,
    padding: 20,
    elevation: 4,
  },
  totalEmiContent: {
    alignItems: 'center',
  },
  totalEmiLabel: {
    color: '#8E8E93',
    fontSize: 16,
    marginBottom: 8,
  },
  totalEmiAmount: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  emiStats: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  emiStat: {
    alignItems: 'center',
  },
  emiStatLabel: {
    color: '#8E8E93',
    fontSize: 14,
    marginBottom: 4,
  },
  emiStatValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  emiList: {
    flex: 1,
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  seeAll: {
    color: '#007AFF',
    fontSize: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 40,
  },
  emptyStateText: {
    color: '#8E8E93',
    fontSize: 18,
    marginTop: 16,
    marginBottom: 24,
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emiCard: {
    backgroundColor: '#2A2C36',
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    flexDirection: 'row',
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  emiInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  emiDetails: {
    flex: 1,
    marginRight: 16,
  },
  emiName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  emiDate: {
    color: '#8E8E93',
    fontSize: 14,
  },
  emiAmount: {
    alignItems: 'flex-end',
  },
  amount: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  emiProgress: {
    color: '#8E8E93',
    fontSize: 14,
  },
});

export default DashboardScreen;
