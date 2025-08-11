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
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.black,
  },
  closeButton: {
    padding: 4,
  },
  addButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  stationInfo: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  stationName: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.black,
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    marginRight: 8,
  },
  ratingText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.black,
    marginRight: 8,
  },
  reviewCount: {
    fontSize: 14,
    color: colors.gray600,
  },
  addReviewContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  addReviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.black,
    marginBottom: 16,
  },
  ratingInput: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  ratingLabel: {
    fontSize: 14,
    color: colors.gray600,
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
    fontSize: 14,
    color: colors.black,
    marginBottom: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  photoUpload: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 8,
    borderStyle: 'dashed',
    marginBottom: 16,
  },
  photoUploadText: {
    marginLeft: 8,
    fontSize: 14,
    color: colors.gray600,
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  reviewsContainer: {
    padding: 20,
  },
  reviewsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.black,
    marginBottom: 16,
  },
  reviewCard: {
    backgroundColor: colors.gray50,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userInitial: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.black,
    marginBottom: 4,
  },
  reviewMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewDate: {
    fontSize: 12,
    color: colors.gray600,
    marginLeft: 8,
  },
  helpfulButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  helpfulText: {
    fontSize: 12,
    color: colors.gray600,
    marginLeft: 4,
  },
  reviewComment: {
    fontSize: 14,
    color: colors.black,
    lineHeight: 20,
    marginBottom: 12,
  },
  photosContainer: {
    marginTop: 8,
  },
  reviewPhoto: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 8,
  },
});

export default SocialFeatures; 