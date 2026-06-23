import { useLocalSearchParams } from 'expo-router';
import { GoalDetailScreen } from '@/screens/GoalDetailScreen';

export default function GoalDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <GoalDetailScreen id={id} />;
}
