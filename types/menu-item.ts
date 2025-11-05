import { MaterialCommunityIcons } from '@expo/vector-icons';

export interface MenuItem {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  badge?: string;
  onPress: () => void;
}

