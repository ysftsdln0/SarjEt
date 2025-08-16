import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ChargingStation } from '../types';
import colors from '../constants/colors';
import { slideUp, slideDown, fadeIn, fadeOut } from '../utils/animationUtils';
import { useTheme } from '../contexts/ThemeContext';

const { width, height } = Dimensions.get('window');

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
  authToken?: string | null;
}

const StationReviewsModal: React.FC<StationReviewsModalProps> = ({
  station,
  visible,
  onClose,
  onHeightChange,
  authToken,
}) => {
  const { isDarkMode } = useTheme();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newReview, setNewReview] = useState({ rating: 0, comment: '', photos: [] as string[] });
  const [showAddReview, setShowAddReview] = useState(false);
  const [loading, setLoading] = useState(false);

  // Animation values
  const slideAnim = useRef(new Animated.Value(height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      showModal();
      fetchReviews();
    } else {
      hideModal();
    }
  }, [visible]);

  const fetchReviews = async () => {
    if (!station?.ID) return;
    
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // For now, use mock data
      const mockReviews: Review[] = [
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
      ];
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      setReviews(mockReviews);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      Alert.alert('Hata', 'Değerlendirmeler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

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

  const handleAddReview = async () => {
    if (newReview.rating === 0) {
      Alert.alert('Hata', 'Lütfen bir puan verin');
      return;
    }
    if (newReview.comment.trim().length < 10) {
      Alert.alert('Hata', 'Yorum en az 10 karakter olmalıdır');
      return;
    }

    try {
      setLoading(true);
      
      // TODO: Replace with actual API call
      // For now, use mock data
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

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setReviews([review, ...reviews]);
      setNewReview({ rating: 0, comment: '', photos: [] });
      setShowAddReview(false);
      Alert.alert('Başarılı', 'Değerlendirmeniz eklendi!');
    } catch (error) {
      console.error('Error adding review:', error);
      Alert.alert('Hata', 'Değerlendirmeniz eklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
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
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.6,
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 1000,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    paddingBottom: 16,
    marginBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  stationInfo: {
    flex: 1,
  },
  stationName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.black,
    marginBottom: 4,
  },
  stationAddress: {
    fontSize: 14,
    color: colors.gray600,
    lineHeight: 20,
  },
  closeButton: {
    padding: 8,
  },
  addReviewSection: {
    marginBottom: 20,
  },
  addReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.gray50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  addReviewText: {
    marginLeft: 8,
    fontSize: 16,
    color: colors.primary,
    fontWeight: '500',
  },
  reviewForm: {
    marginTop: 16,
    padding: 16,
    backgroundColor: colors.gray50,
    borderRadius: 12,
  },
  ratingInput: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  ratingLabel: {
    fontSize: 16,
    color: colors.black,
    marginRight: 12,
  },
  starsInput: {
    flexDirection: 'row',
    gap: 8,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.black,
    backgroundColor: colors.white,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.gray300,
  },
  cancelButtonText: {
    color: colors.gray600,
    fontSize: 14,
    fontWeight: '500',
  },
  submitButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.primary,
    borderRadius: 6,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '500',
  },
  reviewsList: {
    flex: 1,
  },
  reviewItem: {
    padding: 16,
    backgroundColor: colors.gray50,
    borderRadius: 12,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.black,
    marginBottom: 2,
  },
  reviewDate: {
    fontSize: 12,
    color: colors.gray500,
  },
  ratingContainer: {
    alignItems: 'flex-end',
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewComment: {
    fontSize: 14,
    color: colors.black,
    lineHeight: 20,
    marginBottom: 12,
  },
  reviewActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  helpfulButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  helpfulText: {
    marginLeft: 4,
    fontSize: 12,
    color: colors.gray600,
  },
});

export default StationReviewsModal; 