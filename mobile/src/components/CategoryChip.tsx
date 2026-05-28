import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface CategoryChipProps {
  label: string;
  isSelected?: boolean;
  onPress: () => void;
}

const CategoryChip: React.FC<CategoryChipProps> = ({ label, isSelected = false, onPress }) => {
  return (
    <TouchableOpacity
      style={[styles.chip, isSelected && styles.chipSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.label, isSelected && styles.labelSelected]}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginHorizontal: 4,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipSelected: {
    backgroundColor: '#00897B',
    borderColor: '#00897B',
  },
  label: {
    fontSize: 14,
    color: '#616161',
    textAlign: 'center',
  },
  labelSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default CategoryChip;
