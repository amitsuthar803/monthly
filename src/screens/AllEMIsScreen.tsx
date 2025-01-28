import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {emiDataStore} from '../data/emiData';
import {useNavigation} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {emisCollection} from '../config/firebase';
import {colors} from '../theme/colors';
import LinearGradient from 'react-native-linear-gradient';
import type {CompositeNavigationProp} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import type {RootStackParamList, RootTabParamList} from '../types/navigation';

type AllEMIsScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<RootTabParamList, 'All EMIs'>,
  NativeStackNavigationProp<RootStackParamList>
>;

const AllEMIsScreen = () => {
  const navigation = useNavigation<AllEMIsScreenNavigationProp>();
  const [allEMIs, setAllEMIs] = useState(emiDataStore.getAllEMIs());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = emisCollection.onSnapshot(
      snapshot => {
        snapshot.docChanges().forEach(change => {
          const emiData = change.doc.data();
          const emi = {id: change.doc.id, ...emiData};

          if (change.type === 'added' || change.type === 'modified') {
            emiDataStore.updateLocalEMI(emi);
          } else if (change.type === 'removed') {
            emiDataStore.removeLocalEMI(emi.id);
          }
        });

        setAllEMIs(emiDataStore.getAllEMIs());
        setLoading(false);
      },
      error => {
        console.error('Error listening to EMIs:', error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (allEMIs.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Icon name="bank-off" size={48} color={colors.text.tertiary} />
          <Text style={styles.emptyStateText}>No EMIs found</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('AddEMI')}>
            <Text style={styles.addButtonText}>Add New EMI</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {allEMIs.map(emi => (
        <View key={emi.id} style={styles.emiCard}>
          <TouchableOpacity
            style={styles.emiCardContent}
            onPress={() => navigation.navigate('EMIDetails', {emiId: emi.id})}>
            <View style={styles.emiHeader}>
              <LinearGradient
                colors={colors.gradient.card}
                style={styles.emiIcon}>
                <Icon
                  name={emi.status === 'completed' ? 'check-circle' : 'bank'}
                  size={24}
                  color={colors.primary}
                />
              </LinearGradient>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => navigation.navigate('EditEMI', {emiId: emi.id})}>
                <Icon name="pencil" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.emiInfo}>
              <Text style={styles.emiTitle}>{emi.name}</Text>
              <Text style={styles.emiDate}>
                {emi.status === 'completed'
                  ? `Completed on: ${new Date(
                      emi.lastPaymentDate,
                    ).toLocaleDateString()}`
                  : `Next Payment: ${new Date(
                      emi.nextPaymentDate,
                    ).toLocaleDateString()}`}
              </Text>

              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill,
                      { width: `${(emi.currentEMI / emi.tenure) * 100}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.progressText}>
                  {Math.round((emi.currentEMI / emi.tenure) * 100)}% Complete
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          <View style={styles.emiFooter}>
            <View style={styles.emiAmountContainer}>
              <Text style={styles.emiAmount}>₹{emi.emiAmount}</Text>
              <Text style={styles.emiAmountLabel}>Monthly Payment</Text>
            </View>
            <View style={styles.totalAmountContainer}>
              <Text style={styles.totalAmount}>₹{emi.totalAmount}</Text>
              <Text style={styles.totalAmountLabel}>Total Amount</Text>
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.text.tertiary,
    marginTop: 12,
  },
  addButton: {
    marginTop: 20,
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addButtonText: {
    color: colors.white,
    fontSize: 16,
  },
  emiCard: {
    backgroundColor: colors.card.background,
    borderRadius: 20,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: colors.card.shadow,
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  emiCardContent: {
    padding: 16,
  },
  emiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  emiIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.card.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.card.shadow,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emiInfo: {
    marginTop: 8,
  },
  emiTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 6,
  },
  emiDate: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 16,
  },
  progressContainer: {
    marginTop: 12,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.card.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 13,
    color: colors.text.tertiary,
    marginBottom: 8,
  },
  emiFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: colors.card.backgroundLight,
    borderTopWidth: 1,
    borderTopColor: colors.card.border,
  },
  emiAmountContainer: {
    alignItems: 'flex-start',
  },
  totalAmountContainer: {
    alignItems: 'flex-end',
  },
  emiAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  emiAmountLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 4,
  },
  totalAmountLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 4,
  },
});

export default AllEMIsScreen;
