import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {emiDataStore} from '../data/emiData';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {emisCollection} from '../config/firebase';
import type {RootStackParamList, RootTabParamList} from '../types/navigation';

type CompletedScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList & RootTabParamList,
  'Completed'
>;

const CompletedEMIsScreen = () => {
  const navigation = useNavigation<CompletedScreenNavigationProp>();
  const [completedEMIs, setCompletedEMIs] = useState(
    emiDataStore.getCompletedEMIs() || [],
  );
  const [loading, setLoading] = useState(true);

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

          const newCompletedEMIs = emiDataStore.getCompletedEMIs() || [];
          setCompletedEMIs(newCompletedEMIs);
        } catch (error) {
          console.error('Error processing EMI updates:', error);
          setCompletedEMIs([]);
        } finally {
          setLoading(false);
        }
      },
      error => {
        console.error('Error listening to EMIs:', error);
        setLoading(false);
        setCompletedEMIs([]);
      },
    );

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading EMIs...</Text>
      </View>
    );
  }

  if (completedEMIs.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Icon name="bank-off" size={48} color="#8E8E93" />
          <Text style={styles.emptyStateText}>No completed EMIs</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {completedEMIs.map(emi => (
        <TouchableOpacity
          key={emi.id}
          onPress={() => navigation.navigate('EMIDetails', {emiId: emi.id})}
          style={styles.emiCard}>
          <View style={styles.cardIcon}>
            <Icon name="bank" size={24} color="#fff" />
          </View>
          <View style={styles.emiInfo}>
            <View style={styles.emiDetails}>
              <Text style={styles.emiName}>{emi.name}</Text>
              <Text style={styles.emiDate}>
                Completed on:{' '}
                {new Date(emi.lastPaymentDate).toLocaleDateString('en-IN')}
              </Text>
            </View>
            <View style={styles.emiAmount}>
              <Text style={styles.amount}>
                ₹{emi.emiAmount.toLocaleString('en-IN')}
              </Text>
              <Text style={styles.emiNumber}>
                EMI {emi.currentEMI} of {emi.tenure}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1F28',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 24,
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
    fontSize: 16,
    marginTop: 16,
    marginBottom: 24,
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
    fontSize: 16,
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
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  emiNumber: {
    color: '#8E8E93',
    fontSize: 14,
  },
});

export default CompletedEMIsScreen;
