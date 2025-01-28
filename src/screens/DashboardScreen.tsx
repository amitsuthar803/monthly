import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import {emiDataStore} from '../data/emiData';
import {useNavigation} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import {emisCollection} from '../config/firebase';
import {colors} from '../theme/colors';
import type {RootStackParamList, RootTabParamList} from '../types/navigation';
import type {CompositeNavigationProp} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';

type DashboardScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<RootTabParamList, 'Dashboard'>,
  NativeStackNavigationProp<RootStackParamList>
>;

const {width} = Dimensions.get('window');

const DashboardScreen = () => {
  const navigation = useNavigation<DashboardScreenNavigationProp>();
  const [loading, setLoading] = useState(true);
  const [upcomingEMIs, setUpcomingEMIs] = useState(
    emiDataStore.getUpcomingEMIs() || [],
  );
  const [totalMonthlyEMI, setTotalMonthlyEMI] = useState(
    emiDataStore.getTotalMonthlyEMI() || 0,
  );
  const [currentMonthTotal, setCurrentMonthTotal] = useState(
    emiDataStore.getCurrentMonthTotalEMI() || 0,
  );
  const [currentMonthPaid, setCurrentMonthPaid] = useState(
    emiDataStore.getCurrentMonthPaidAmount() || 0,
  );
  const [totalEMIAmount, setTotalEMIAmount] = useState(
    emiDataStore.getTotalEMIAmount() || 0,
  );
  const [totalPaidAmount, setTotalPaidAmount] = useState(
    emiDataStore.getTotalPaidAmount() || 0,
  );

  const formatAmount = (amount: number) => {
    return amount.toLocaleString('en-IN', {
      maximumFractionDigits: 0,
      style: 'currency',
      currency: 'INR',
    });
  };

  const calculateProgressWidth = () => {
    if (currentMonthTotal === 0) return 0;
    const percentage = (currentMonthPaid / currentMonthTotal) * 100;
    return Math.min(100, Math.max(0, percentage));
  };

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

          setUpcomingEMIs(emiDataStore.getUpcomingEMIs());
          setTotalMonthlyEMI(emiDataStore.getTotalMonthlyEMI());
          setCurrentMonthTotal(emiDataStore.getCurrentMonthTotalEMI());
          setCurrentMonthPaid(emiDataStore.getCurrentMonthPaidAmount());
          setTotalEMIAmount(emiDataStore.getTotalEMIAmount());
          setTotalPaidAmount(emiDataStore.getTotalPaidAmount());
          setLoading(false);
        } catch (error) {
          console.error('Error processing snapshot:', error);
          setLoading(false);
        }
      },
      error => {
        console.error('Error fetching EMIs:', error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  const handleAddEMI = () => {
    navigation.navigate('AddEMI');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={colors.background} barStyle="light-content" />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back 👋</Text>
            <Text style={styles.name}>Amit Suthar</Text>
          </View>
          {/* <LinearGradient
            colors={colors.gradient.card}
            style={styles.profileButton}>
            <Icon name="account" size={24} color={colors.primary} />
          </LinearGradient> */}
        </View>

        {/* Total EMI Card */}
        <LinearGradient
          colors={colors.gradient.primary}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={styles.totalEmiCard}>
          <View style={styles.totalEmiContent}>
            <Text style={styles.totalEmiLabel}>EMI Overview</Text>
            <Text style={styles.totalEmiAmount}>
              {formatAmount(totalMonthlyEMI)}/month
            </Text>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {width: `${calculateProgressWidth()}%`},
                  ]}
                />
              </View>
              <View style={styles.progressLabels}>
                <Text style={styles.progressLabel}>
                  Paid: {formatAmount(currentMonthPaid)}
                </Text>
                <Text style={styles.progressLabel}>
                  Due: {formatAmount(currentMonthTotal)}
                </Text>
              </View>
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Icon name="arrow-up" size={20} color={colors.success} />
                <Text style={styles.statText}>Active EMIs</Text>
                <Text style={styles.statValue}>{upcomingEMIs.length}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.statItem}>
                <Icon name="check-circle" size={20} color={colors.white} />
                <Text style={styles.statText}>Completed</Text>
                <Text style={styles.statValue}>
                  {emiDataStore.getCompletedEMIs().length}
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Upcoming EMIs */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming EMIs</Text>
            <TouchableOpacity onPress={() => navigation.navigate('All EMIs')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          {upcomingEMIs.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon
                name="playlist-plus"
                size={48}
                color={colors.text.tertiary}
              />
              <Text style={styles.emptyStateText}>No upcoming EMIs</Text>
            </View>
          ) : (
            <View style={styles.emiList}>
              {upcomingEMIs.slice(0, 3).map(emi => (
                <View key={emi.id} style={styles.emiCard}>
                  <TouchableOpacity
                    style={styles.emiCardContent}
                    onPress={() =>
                      navigation.navigate('EMIDetails', {emiId: emi.id})
                    }>
                    <View style={styles.emiHeader}>
                      <LinearGradient
                        colors={colors.gradient.card}
                        style={styles.emiIcon}>
                        <Icon
                          name="calendar-clock"
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
                        EMI {emi.currentEMI + 1} of {emi.tenure} • Due{' '}
                        {new Date(emi.nextPaymentDate).toLocaleDateString()}
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
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add EMI Button */}
      <TouchableOpacity style={styles.addButton} onPress={handleAddEMI}>
        <LinearGradient
          colors={colors.gradient.success}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={styles.addButtonGradient}>
          <Icon name="plus" size={24} color={colors.white} />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  greeting: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.card.shadow,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  totalEmiCard: {
    margin: 20,
    borderRadius: 24,
    padding: 24,
  },
  totalEmiContent: {
    width: '100%',
  },
  totalEmiLabel: {
    fontSize: 14,
    color: colors.white,
    opacity: 0.8,
    marginBottom: 8,
  },
  totalEmiAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: colors.white,
    opacity: 0.2,
  },
  statText: {
    fontSize: 12,
    color: colors.white,
    opacity: 0.8,
    marginVertical: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  seeAll: {
    fontSize: 14,
    color: colors.primary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.text.tertiary,
  },
  emiList: {
    gap: 12,
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
  addButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
  },
  addButtonGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.success,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  progressContainer: {
    marginVertical: 10,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 5,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: 4,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  progressLabel: {
    fontSize: 12,
    color: colors.white,
    opacity: 0.9,
  },
});

export default DashboardScreen;
