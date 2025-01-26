import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {BottomTabScreenProps} from '@react-navigation/bottom-tabs';

export type RootStackParamList = {
  Main: undefined;
  EMIDetails: {emiId: string};
  AddEMI: undefined;
};

export type RootTabParamList = {
  Dashboard: undefined;
  'All EMIs': undefined;
  Active: undefined;
  Completed: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type RootTabScreenProps<T extends keyof RootTabParamList> =
  BottomTabScreenProps<RootTabParamList, T>;
