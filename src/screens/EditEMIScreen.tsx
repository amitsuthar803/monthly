import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import {colors} from '../theme/colors';
import {emiDataStore} from '../data/emiData';
import {format} from 'date-fns';
import type {EMI} from '../data/emiData';

const EditEMIScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const emiId = route.params?.emiId;
  const [loading, setLoading] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [formData, setFormData] = useState<Partial<EMI>>({
    name: '',
    totalAmount: 0,
    emiAmount: 0,
    startDate: new Date().toISOString(),
    tenure: 0,
    interestRate: 0,
  });

  useEffect(() => {
    const loadEMI = async () => {
      try {
        const emi = await emiDataStore.getEMIById(emiId);
        if (emi) {
          setFormData({
            name: emi.name,
            totalAmount: emi.totalAmount,
            emiAmount: emi.emiAmount,
            startDate: emi.startDate,
            tenure: emi.tenure,
            interestRate: emi.interestRate,
          });
        }
        setLoading(false);
      } catch (error) {
        console.error('Error loading EMI:', error);
        Alert.alert('Error', 'Failed to load EMI details');
        navigation.goBack();
      }
    };

    loadEMI();
  }, [emiId]);

  const handleUpdateEMI = async () => {
    try {
      if (!formData.name || !formData.totalAmount || !formData.emiAmount) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      const updatedEMI = {
        id: emiId,
        name: formData.name,
        totalAmount: Number(formData.totalAmount),
        emiAmount: Number(formData.emiAmount),
        startDate: formData.startDate!,
        tenure: Number(formData.tenure),
        interestRate: Number(formData.interestRate),
      };

      await emiDataStore.updateEMI(updatedEMI);
      Alert.alert('Success', 'EMI updated successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Error updating EMI:', error);
      Alert.alert('Error', 'Failed to update EMI');
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData(prev => ({
        ...prev,
        startDate: selectedDate.toISOString(),
      }));
    }
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
      <ScrollView style={styles.scrollView}>
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>EMI Name</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={text => setFormData(prev => ({...prev, name: text}))}
              placeholder="Enter EMI name"
              placeholderTextColor={colors.text.tertiary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Total Amount</Text>
            <TextInput
              style={styles.input}
              value={formData.totalAmount?.toString()}
              onChangeText={text =>
                setFormData(prev => ({...prev, totalAmount: Number(text)}))
              }
              keyboardType="numeric"
              placeholder="Enter total amount"
              placeholderTextColor={colors.text.tertiary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>EMI Amount</Text>
            <TextInput
              style={styles.input}
              value={formData.emiAmount?.toString()}
              onChangeText={text =>
                setFormData(prev => ({...prev, emiAmount: Number(text)}))
              }
              keyboardType="numeric"
              placeholder="Enter EMI amount"
              placeholderTextColor={colors.text.tertiary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Start Date</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}>
              <Text style={styles.dateButtonText}>
                {format(new Date(formData.startDate!), 'dd/MM/yyyy')}
              </Text>
              <Icon name="calendar" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tenure (months)</Text>
            <TextInput
              style={styles.input}
              value={formData.tenure?.toString()}
              onChangeText={text =>
                setFormData(prev => ({...prev, tenure: Number(text)}))
              }
              keyboardType="numeric"
              placeholder="Enter tenure in months"
              placeholderTextColor={colors.text.tertiary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Interest Rate (%)</Text>
            <TextInput
              style={styles.input}
              value={formData.interestRate?.toString()}
              onChangeText={text =>
                setFormData(prev => ({...prev, interestRate: Number(text)}))
              }
              keyboardType="numeric"
              placeholder="Enter interest rate"
              placeholderTextColor={colors.text.tertiary}
            />
          </View>
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.updateButton} onPress={handleUpdateEMI}>
          <LinearGradient
            colors={colors.gradient.primary}
            style={styles.updateButtonGradient}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}>
            <Text style={styles.updateButtonText}>Update EMI</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={new Date(formData.startDate!)}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}
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
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.card.background,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.card.border,
  },
  dateButton: {
    backgroundColor: colors.card.background,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.card.border,
  },
  dateButtonText: {
    fontSize: 16,
    color: colors.text.primary,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.card.background,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.card.border,
  },
  cancelButtonText: {
    fontSize: 16,
    color: colors.text.primary,
    fontWeight: '600',
  },
  updateButton: {
    flex: 1,
  },
  updateButtonGradient: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  updateButtonText: {
    fontSize: 16,
    color: colors.white,
    fontWeight: '600',
  },
});

export default EditEMIScreen;
