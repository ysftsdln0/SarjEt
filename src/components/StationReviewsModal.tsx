import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ChargingStation } from '../types';
import colors from '../constants/colors';
import { slideUp, slideDown, fadeIn, fadeOut } from '../utils/animationUtils';

const { height } = Dimensions.get('window');

export interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
  photos: string[];
  helpful: number;
}

interface StationReviewsModalProps {
  station: ChargingStation | null;
  visible: boolean;
  onClose: () => void;
  onHeightChange?: (height: number) => void;
}

const StationReviewsModal: React.FC<StationReviewsModalProps> = ({
  station,
  visible,
  onClose,
  onHeightChange,
}) => {
  const [reviews, setReviews] = useState<Review[]>([
    {
      id: '1',
      userId: 'user1',
      userName: 'Ahmet Y.',
      rating: 5,
      comment: 'Çok hızlı şarj, park yeri de var. Kesinlikle tavsiye ederim!',
      date: '2024-01-15',
      photos: [],
      helpful: 12,
    },
    {
      id: '2',
      userId: 'user2',
      userName: 'Fatma K.',
      rating: 4,
      comment: 'İyi istasyon ama biraz pahalı. Hızlı şarj yapıyor.',
      date: '2024-01-14',
      photos: [],
      helpful: 8,
    },
    {
      id: '3',
      userId: 'user3',
      userName: 'Mehmet A.',
      rating: 5,
      comment: 'Mükemmel! 24 saat açık ve güvenli.',
      date: '2024-01-13',
      photos: [],
      helpful: 15,
    },
  ]);

  const [newReview, setNewReview] = useState({ rating: 0, comment: '', photos: [] as string[] });
  const [showAddReview, setShowAddReview] = useState(false);

  // Animation values
  const slideAnim = useRef(new Animated.Value(height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      showModal();
    } else {
      hideModal();
    }
  }, [visible]);

  const showModal = () => {
    slideDown(slideAnim).start();
    fadeIn(fadeAnim).start();
    onHeightChange?.(height * 0.5); // Harita yüksekliğini daha az azalt
  };

  const hideModal = () => {
    slideUp(slideAnim).start();
    fadeOut(fadeAnim).start();
    onHeightChange?.(height); // Harita tam yükseklik
  };

  const handleClose = () => {
    hideModal();
    setTimeout(() => onClose(), 300);
  };

  const handleAddReview = () => {
    if (newReview.rating === 0) {
      Alert.alert('Hata', 'Lütfen bir puan verin');
      return;
    }
    if (newReview.comment.trim().length < 10) {
      Alert.alert('Hata', 'Yorum en az 10 karakter olmalıdır');
      return;
    }

    const review: Review = {
      id: Date.now().toString(),
      userId: 'currentUser',
      userName: 'Siz',
      rating: newReview.rating,
      comment: newReview.comment,
      date: new Date().toISOString().split('T')[0],
      photos: newReview.photos,
      helpful: 0,
    };

    setReviews([review, ...reviews]);
    setNewReview({ rating: 0, comment: '', photos: [] });
    setShowAddReview(false);
    Alert.alert('Başarılı', 'Değerlendirmeniz eklendi!');
  };

  const handleHelpful = (reviewId: string) => {
    setReviews(reviews.map(review =>
      review.id === reviewId
        ? { ...review, helpful: review.helpful + 1 }
        : review
    ));
  };

  const renderStars = (rating: number) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= rating ? 'star' : 'star-outline'}
            size={16}
            color={colors.accent1}
          />
        ))}
      </View>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (!station) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          opacity: fadeAnim,
        },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.stationInfo}>
            <Text style={styles.stationName}>
              {station.AddressInfo?.Title || 'İstasyon'}
            </Text>
            <Text style={styles.stationAddress}>
              {station.AddressInfo?.AddressLine1 || 'Adres bilgisi yok'}
            </Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={24} color={colors.gray600} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Add Review Section */}
      <View style={styles.addReviewSection}>
        <TouchableOpacity
          style={styles.addReviewButton}
          onPress={() => setShowAddReview(!showAddReview)}
        >
          <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
          <Text style={styles.addReviewText}>Değerlendirme Ekle</Text>
        </TouchableOpacity>

        {showAddReview && (
          <View style={styles.reviewForm}>
            <View style={styles.ratingInput}>
              <Text style={styles.ratingLabel}>Puanınız:</Text>
              <View style={styles.starsInput}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setNewReview({ ...newReview, rating: star })}
                  >
                    <Ionicons
                      name={star <= newReview.rating ? 'star' : 'star-outline'}
                      size={24}
                      color={colors.accent1}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <TextInput
              style={styles.commentInput}
              placeholder="Deneyiminizi paylaşın..."
              placeholderTextColor={colors.gray500}
              value={newReview.comment}
              onChangeText={(text) => setNewReview({ ...newReview, comment: text })}
              multiline
              numberOfLines={3}
            />
            <View style={styles.formActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowAddReview(false)}
              >
                <Text style={styles.cancelButtonText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitButton} onPress={handleAddReview}>
                <Text style={styles.submitButtonText}>Gönder</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Reviews List */}
      <ScrollView style={styles.reviewsList} showsVerticalScrollIndicator={false}>
        {reviews.map((review) => (
          <View key={review.id} style={styles.reviewItem}>
            <View style={styles.reviewHeader}>
              <View style={styles.reviewerInfo}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {review.userName.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View>
                  <Text style={styles.reviewerName}>{review.userName}</Text>
                  <Text style={styles.reviewDate}>{formatDate(review.date)}</Text>
                </View>
              </View>
              <View style={styles.ratingContainer}>
                {renderStars(review.rating)}
              </View>
            </View>
            <Text style={styles.reviewComment}>{review.comment}</Text>
            <View style={styles.reviewActions}>
              <TouchableOpacity
                style={styles.helpfulButton}
                onPress={() => handleHelpful(review.id)}
              >
                <Ionicons name="thumbs-up-outline" size={16} color={colors.gray600} />
                <Text style={styles.helpfulText}>Yardımcı ({review.helpful})</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  addReviewButton: {
    alignItems: 'center',
    backgroundColor: colors.gray50,
    borderColor: colors.gray200,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    padding: 12,
  },
  addReviewSection: {
    marginBottom: 20,
  },
  addReviewText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    marginRight: 12,
    width: 32,
  },
  avatarText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  cancelButton: {
    borderColor: colors.gray300,
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  cancelButtonText: {
    color: colors.gray600,
    fontSize: 14,
    fontWeight: '500',
  },
  closeButton: {
    padding: 8,
  },
  commentInput: {
    backgroundColor: colors.white,
    borderColor: colors.gray300,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.black,
    fontSize: 16,
    minHeight: 80,
    padding: 12,
    textAlignVertical: 'top',
  },
  container: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    bottom: 0,
    elevation: 10,
    height: height * 0.6,
    left: 0,
    paddingBottom: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    position: 'absolute',
    right: 0,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    zIndex: 1000,
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  header: {
    borderBottomColor: colors.gray200,
    borderBottomWidth: 1,
    marginBottom: 16,
    paddingBottom: 16,
  },
  headerContent: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  helpfulButton: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.gray200,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    padding: 8,
  },
  helpfulText: {
    color: colors.gray600,
    fontSize: 12,
    marginLeft: 4,
  },
  ratingContainer: {
    alignItems: 'flex-end',
  },
  ratingInput: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 16,
  },
  ratingLabel: {
    color: colors.black,
    fontSize: 16,
    marginRight: 12,
  },
  reviewActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  reviewComment: {
    color: colors.black,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  reviewDate: {
    color: colors.gray500,
    fontSize: 12,
  },
  reviewForm: {
    backgroundColor: colors.gray50,
    borderRadius: 12,
    marginTop: 16,
    padding: 16,
  },
  reviewHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  reviewItem: {
    backgroundColor: colors.gray50,
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
  },
  reviewerInfo: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  reviewerName: {
    color: colors.black,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  reviewsList: {
    flex: 1,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  starsInput: {
    flexDirection: 'row',
    gap: 8,
  },
  stationAddress: {
    color: colors.gray600,
    fontSize: 14,
    lineHeight: 20,
  },
  stationInfo: {
    flex: 1,
  },
  stationName: {
    color: colors.black,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default StationReviewsModal; 