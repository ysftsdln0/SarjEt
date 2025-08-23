import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ChargingStation } from '../types';
import colors from '../constants/colors';

export interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  photos: string[];
  timestamp: number;
  helpful: number;
}

interface SocialFeaturesProps {
  station: ChargingStation;
  onClose: () => void;
}

const SocialFeatures: React.FC<SocialFeaturesProps> = ({ station, onClose }) => {
  const [reviews, setReviews] = useState<Review[]>([
    {
      id: '1',
      userId: 'user1',
      userName: 'Ahmet Y.',
      rating: 5,
      comment: 'Harika bir istasyon! Hızlı şarj ve temiz ortam.',
      photos: [],
      timestamp: Date.now() - 86400000,
      helpful: 12,
    },
    {
      id: '2',
      userId: 'user2',
      userName: 'Ayşe K.',
      rating: 4,
      comment: 'Güzel istasyon ama biraz pahalı. Hızlı şarj yapıyor.',
      photos: [],
      timestamp: Date.now() - 172800000,
      helpful: 8,
    },
  ]);

  const [newReview, setNewReview] = useState({
    rating: 0,
    comment: '',
    photos: [] as string[],
  });

  const [showAddReview, setShowAddReview] = useState(false);

  const handleAddReview = () => {
    if (newReview.rating === 0) {
      Alert.alert('Hata', 'Lütfen bir puan verin.');
      return;
    }
    if (newReview.comment.trim().length < 10) {
      Alert.alert('Hata', 'Yorum en az 10 karakter olmalıdır.');
      return;
    }

    const review: Review = {
      id: Date.now().toString(),
      userId: 'currentUser',
      userName: 'Siz',
      rating: newReview.rating,
      comment: newReview.comment,
      photos: newReview.photos,
      timestamp: Date.now(),
      helpful: 0,
    };

    setReviews(prev => [review, ...prev]);
    setNewReview({ rating: 0, comment: '', photos: [] });
    setShowAddReview(false);
    Alert.alert('Başarılı', 'Yorumunuz eklendi!');
  };

  const handleHelpful = (reviewId: string) => {
    setReviews(prev => 
      prev.map(review => 
        review.id === reviewId 
          ? { ...review, helpful: review.helpful + 1 }
          : review
      )
    );
  };

  const renderStars = (rating: number, size: number = 16) => {
    return [1, 2, 3, 4, 5].map((star) => (
      <Ionicons
        key={star}
        name={star <= rating ? 'star' : 'star-outline'}
        size={size}
        color={colors.accent1}
      />
    ));
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Bugün';
    if (days === 1) return 'Dün';
    if (days < 7) return `${days} gün önce`;
    return date.toLocaleDateString('tr-TR');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={colors.black} />
        </TouchableOpacity>
        <Text style={styles.title}>Değerlendirmeler</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowAddReview(!showAddReview)}
        >
          <Ionicons name="add" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Station Info */}
        <View style={styles.stationInfo}>
          <Text style={styles.stationName}>{station.AddressInfo?.Title}</Text>
          <View style={styles.ratingContainer}>
            <View style={styles.starsContainer}>
              {renderStars(4.2, 20)}
            </View>
            <Text style={styles.ratingText}>4.2</Text>
            <Text style={styles.reviewCount}>({reviews.length} değerlendirme)</Text>
          </View>
        </View>

        {/* Add Review */}
        {showAddReview && (
          <View style={styles.addReviewContainer}>
            <Text style={styles.addReviewTitle}>Yorum Ekle</Text>
            
            {/* Rating */}
            <View style={styles.ratingInput}>
              <Text style={styles.ratingLabel}>Puanınız:</Text>
              <View style={styles.starsInput}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setNewReview(prev => ({ ...prev, rating: star }))}
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

            {/* Comment */}
            <TextInput
              style={styles.commentInput}
              placeholder="Deneyiminizi paylaşın..."
              value={newReview.comment}
              onChangeText={(text) => setNewReview(prev => ({ ...prev, comment: text }))}
              multiline
              numberOfLines={4}
            />

            {/* Photo Upload */}
            <TouchableOpacity style={styles.photoUpload}>
              <Ionicons name="camera" size={24} color={colors.gray600} />
              <Text style={styles.photoUploadText}>Fotoğraf Ekle</Text>
            </TouchableOpacity>

            {/* Submit Button */}
            <TouchableOpacity style={styles.submitButton} onPress={handleAddReview}>
              <Text style={styles.submitButtonText}>Yorumu Gönder</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Reviews List */}
        <View style={styles.reviewsContainer}>
          <Text style={styles.reviewsTitle}>Tüm Değerlendirmeler</Text>
          
          {reviews.map((review) => (
            <View key={review.id} style={styles.reviewCard}>
              {/* Review Header */}
              <View style={styles.reviewHeader}>
                <View style={styles.userInfo}>
                  <View style={styles.userAvatar}>
                    <Text style={styles.userInitial}>
                      {review.userName.charAt(0)}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.userName}>{review.userName}</Text>
                    <View style={styles.reviewMeta}>
                      <View style={styles.starsContainer}>
                        {renderStars(review.rating)}
                      </View>
                      <Text style={styles.reviewDate}>
                        {formatDate(review.timestamp)}
                      </Text>
                    </View>
                  </View>
                </View>
                
                <TouchableOpacity 
                  style={styles.helpfulButton}
                  onPress={() => handleHelpful(review.id)}
                >
                  <Ionicons name="thumbs-up" size={16} color={colors.gray600} />
                  <Text style={styles.helpfulText}>{review.helpful}</Text>
                </TouchableOpacity>
              </View>

              {/* Review Content */}
              <Text style={styles.reviewComment}>{review.comment}</Text>

              {/* Review Photos */}
              {review.photos.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosContainer}>
                  {review.photos.map((photo, index) => (
                    <Image key={index} source={{ uri: photo }} style={styles.reviewPhoto} />
                  ))}
                </ScrollView>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  addButton: {
    padding: 4,
  },
  addReviewContainer: {
    borderBottomColor: colors.gray100,
    borderBottomWidth: 1,
    padding: 20,
  },
  addReviewTitle: {
    color: colors.black,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  closeButton: {
    padding: 4,
  },
  commentInput: {
    borderColor: colors.gray300,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.black,
    fontSize: 14,
    marginBottom: 16,
    minHeight: 80,
    padding: 12,
    textAlignVertical: 'top',
  },
  container: {
    backgroundColor: colors.white,
    flex: 1,
  },
  content: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    borderBottomColor: colors.gray200,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
  },
  helpfulButton: {
    alignItems: 'center',
    flexDirection: 'row',
    padding: 8,
  },
  helpfulText: {
    color: colors.gray600,
    fontSize: 12,
    marginLeft: 4,
  },
  photoUpload: {
    alignItems: 'center',
    borderColor: colors.gray300,
    borderRadius: 8,
    borderStyle: 'dashed',
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 16,
    padding: 16,
  },
  photoUploadText: {
    color: colors.gray600,
    fontSize: 14,
    marginLeft: 8,
  },
  photosContainer: {
    marginTop: 8,
  },
  ratingContainer: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  ratingInput: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 16,
  },
  ratingLabel: {
    color: colors.gray600,
    fontSize: 14,
    marginRight: 12,
  },
  ratingText: {
    color: colors.black,
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
  reviewCard: {
    backgroundColor: colors.gray50,
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
  },
  reviewComment: {
    color: colors.black,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  reviewCount: {
    color: colors.gray600,
    fontSize: 14,
  },
  reviewDate: {
    color: colors.gray600,
    fontSize: 12,
    marginLeft: 8,
  },
  reviewHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  reviewMeta: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  reviewPhoto: {
    borderRadius: 8,
    height: 80,
    marginRight: 8,
    width: 80,
  },
  reviewsContainer: {
    padding: 20,
  },
  reviewsTitle: {
    color: colors.black,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  starsContainer: {
    flexDirection: 'row',
    marginRight: 8,
  },
  starsInput: {
    flexDirection: 'row',
    gap: 8,
  },
  stationInfo: {
    borderBottomColor: colors.gray100,
    borderBottomWidth: 1,
    padding: 20,
  },
  stationName: {
    color: colors.black,
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  submitButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    color: colors.black,
    fontSize: 18,
    fontWeight: '600',
  },
  userAvatar: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    marginRight: 12,
    width: 40,
  },
  userInfo: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
  },
  userInitial: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  userName: {
    color: colors.black,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
});

export default SocialFeatures; 