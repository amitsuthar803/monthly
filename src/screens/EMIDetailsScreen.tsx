import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import {emiDataStore} from '../data/emiData';
import {useRoute, useNavigation} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const EMIDetailsScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const {emiId} = route.params as {emiId: string};
  const emi = emiDataStore.getEMIById(emiId);

  const handleDelete = () => {
    Alert.alert(
      'Delete EMI',
      'Are you sure you want to delete this EMI? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await emiDataStore.deleteEMI(emiId);
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting EMI:', error);
              Alert.alert('Error', 'Failed to delete EMI. Please try again.');
            }
          },
        },
      ],
    );
  };

  if (!emi) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>EMI not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View
        style={[
          styles.header,
          emi.status === 'completed' && styles.completedHeader,
        ]}>
        <View
          style={[
            styles.headerIcon,
            emi.status === 'completed' && styles.completedIcon,
          ]}>
          <Icon
            name={emi.status === 'completed' ? 'check-circle' : 'bank'}
            size={32}
            color="#fff"
          />
        </View>
        <Text style={styles.title}>{emi.name}</Text>
        <Text style={styles.amount}>₹{emi.totalAmount || 0}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.labelContainer}>
              <Icon name="cash" size={20} color="#8E8E93" />
              <Text style={styles.label}>EMI Amount</Text>
            </View>
            <Text style={styles.value}>₹{emi.emiAmount || 0}</Text>
          </View>
          <View style={styles.infoRow}>
            <View style={styles.labelContainer}>
              <Icon name="percent" size={20} color="#8E8E93" />
              <Text style={styles.label}>Interest Rate</Text>
            </View>
            <Text style={styles.value}>{emi.interestRate}%</Text>
          </View>
          <View style={styles.infoRow}>
            <View style={styles.labelContainer}>
              <Icon name="calendar-month" size={20} color="#8E8E93" />
              <Text style={styles.label}>Tenure</Text>
            </View>
            <Text style={styles.value}>{emi.tenure} months</Text>
          </View>
          <View style={styles.infoRow}>
            <View style={styles.labelContainer}>
              <Icon name="calendar" size={20} color="#8E8E93" />
              <Text style={styles.label}>Start Date</Text>
            </View>
            <Text style={styles.value}>
              {emi.startDate
                ? new Date(emi.startDate).toLocaleDateString()
                : 'Invalid Date'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <View style={styles.labelContainer}>
              <Icon name="calendar-check" size={20} color="#8E8E93" />
              <Text style={styles.label}>Last EMI Date</Text>
            </View>
            <Text style={styles.value}>
              {emi.lastPaymentDate
                ? new Date(emi.lastPaymentDate).toLocaleDateString()
                : 'Invalid Date'}
            </Text>
          </View>
        </View>

        <View style={styles.progressCard}>
          <Text style={styles.progressTitle}>Progress</Text>
          <View style={styles.progressRow}>
            <View style={styles.labelContainer}>
              <Icon name="check-circle-outline" size={20} color="#8E8E93" />
              <Text style={styles.label}>EMIs Paid</Text>
            </View>
            <Text style={styles.value}>
              {emi.currentEMI}/{emi.tenure}
            </Text>
          </View>
          <View style={styles.progressRow}>
            <View style={styles.labelContainer}>
              <Icon name="cash-multiple" size={20} color="#8E8E93" />
              <Text style={styles.label}>Amount Paid</Text>
            </View>
            <Text style={styles.value}>₹{emi.totalPaid}</Text>
          </View>
          <View style={styles.progressRow}>
            <View style={styles.labelContainer}>
              <Icon name="information" size={20} color="#8E8E93" />
              <Text style={styles.label}>Status</Text>
            </View>
            <Text
              style={[
                styles.statusTag,
                {
                  backgroundColor:
                    emi.status === 'completed' ? '#4CAF50' : '#007AFF',
                },
              ]}>
              {emi.status.toUpperCase()}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Icon name="trash-can-outline" size={20} color="#fff" />
          <Text style={styles.deleteButtonText}>Delete EMI</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1F28',
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 24,
  },
  header: {
    padding: 24,
    backgroundColor: '#2A2C36',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    alignItems: 'center',
  },
  completedHeader: {
    backgroundColor: '#1B5E20',
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  completedIcon: {
    backgroundColor: '#4CAF50',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  amount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    padding: 20,
  },
  infoCard: {
    backgroundColor: '#2A2C36',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#3A3C46',
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    color: '#8E8E93',
    marginLeft: 8,
  },
  value: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  progressCard: {
    backgroundColor: '#2A2C36',
    borderRadius: 16,
    padding: 20,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  statusTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  deleteButton: {
    backgroundColor: '#DC3545',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default EMIDetailsScreen;
