import { useLocalSearchParams } from 'expo-router';
import { TransactionHistoryScreen } from '@/screens/TransactionHistoryScreen';

export default function Transactions() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <TransactionHistoryScreen id={id} />;
}
