import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface RatingStarsProps {
  rating: number;
  size?: number;
  showValue?: boolean;
}

const RatingStars: React.FC<RatingStarsProps> = ({ rating, size = 16, showValue = false }) => {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.5;

  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      stars.push('★');
    } else if (i === fullStars && hasHalf) {
      stars.push('★');
    } else {
      stars.push('☆');
    }
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.stars, { fontSize: size }]}>{stars.join('')}</Text>
      {showValue && <Text style={styles.value}>{rating.toFixed(1)}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stars: {
    color: '#FFC107',
  },
  value: {
    marginHorizontal: 4,
    fontSize: 12,
    color: '#616161',
  },
});

export default RatingStars;
