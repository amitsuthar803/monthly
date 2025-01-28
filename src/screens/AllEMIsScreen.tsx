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
            <View
              style={[
                styles.cardIcon,
                emi.status === 'completed' && styles.completedIcon,
              ]}>
              <Icon
                name={emi.status === 'completed' ? 'check-circle' : 'bank'}
                size={24}
                color="#fff"
              />
            </View>
            <View style={styles.emiInfo}>
              <View style={styles.emiDetails}>
                <Text style={styles.emiName}>{emi.name}</Text>
                <Text style={styles.emiDate}>
                  {emi.status === 'completed'
                    ? `Completed on: ${new Date(
                        emi.lastPaymentDate,
                      ).toLocaleDateString()}`
                    : `Next: ${new Date(
                        emi.nextPaymentDate,
                      ).toLocaleDateString()}`}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
          <View style={styles.emiActions}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => navigation.navigate('EditEMI', {emiId: emi.id})}>
              <Icon name="pencil" size={20} color={colors.primary} />
            </TouchableOpacity>
            <View style={styles.emiAmountContainer}>
              <Text style={styles.emiAmount}>₹{emi.emiAmount}</Text>
              <Text style={styles.emiAmountLabel}>
                {emi.status === 'completed' ? 'paid' : 'to pay'}
              </Text>
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
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: colors.card.shadow,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  emiCardContent: {
    flexDirection: 'row',
    padding: 16,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedIcon: {
    backgroundColor: colors.success,
  },
  emiInfo: {
    flex: 1,
    marginLeft: 12,
  },
  emiDetails: {
    flex: 1,
  },
  emiName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  emiDate: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  emiActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: colors.card.border,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.card.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.card.border,
  },
  emiAmountContainer: {
    alignItems: 'flex-end',
  },
  emiAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  emiAmountLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
});

export default AllEMIsScreen;
