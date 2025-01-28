import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {BottomTabScreenProps} from '@react-navigation/bottom-tabs';

export type RootStackParamList = {
  Main: undefined;
  EMIDetails: {emiId: string};
  AddEMI: undefined;
  EditEMI: {emiId: string};
};

export type RootTabParamList = {
  Dashboard: undefined;
  About: undefined;
  'All EMIs': undefined;
  'Completed EMIs': undefined;
  'Active EMIs': undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type RootTabScreenProps<T extends keyof RootTabParamList> =
  BottomTabScreenProps<RootTabParamList, T>;
