import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../constants/colors';

interface PrivacySettingsModalProps {
  visible: boolean;
  onClose: () => void;
  isDarkMode: boolean;
}

export const PrivacySettingsModal: React.FC<PrivacySettingsModalProps> = ({
  visible,
  onClose,
  isDarkMode,
}) => {
  const [locationSharing, setLocationSharing] = useState(true);
  const [dataCollection, setDataCollection] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(true);
  const [thirdPartySharing, setThirdPartySharing] = useState(false);

  const handleSaveSettings = () => {
    // TODO: API çağrısı yapılacak
    Alert.alert('Başarılı', 'Gizlilik ayarlarınız kaydedildi.', [
      { text: 'Tamam', onPress: onClose }
    ]);
  };

  const PrivacyOption = ({ 
    title, 
    description, 
    value, 
    onValueChange, 
    icon 
  }: {
    title: string;
    description: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
    icon: string;
  }) => (
    <View style={[styles.optionContainer, !isDarkMode && styles.lightOptionContainer]}>
      <View style={styles.optionHeader}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon as any} size={20} color={colors.primary} />
        </View>
        <View style={styles.optionContent}>
          <Text style={[styles.optionTitle, !isDarkMode && styles.lightOptionTitle]}>
            {title}
          </Text>
          <Text style={[styles.optionDescription, !isDarkMode && styles.lightOptionDescription]}>
            {description}
          </Text>
        </View>
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: colors.gray400, true: colors.primary }}
          thumbColor={colors.white}
        />
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, !isDarkMode && styles.lightContainer]}>
        <View style={[styles.header, !isDarkMode && styles.lightHeader]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={isDarkMode ? colors.white : colors.black} />
          </TouchableOpacity>
          <Text style={[styles.title, !isDarkMode && styles.lightTitle]}>
            Gizlilik Ayarları
          </Text>
          <TouchableOpacity 
            onPress={handleSaveSettings} 
            style={styles.saveButton}
          >
            <Text style={styles.saveButtonText}>Kaydet</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Konum ve Veri */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, !isDarkMode && styles.lightSectionTitle]}>
              Konum ve Veri
            </Text>
            
            <PrivacyOption
              title="Konum Paylaşımı"
              description="Yakınınızdaki şarj istasyonlarını bulabilmek için konumunuzu paylaşın"
              value={locationSharing}
              onValueChange={setLocationSharing}
              icon="location-outline"
            />
            
            <PrivacyOption
              title="Veri Toplama"
              description="Uygulama deneyiminizi iyileştirmek için kullanım verilerinizi toplayabiliriz"
              value={dataCollection}
              onValueChange={setDataCollection}
              icon="analytics-outline"
            />
            
            <PrivacyOption
              title="Analitik Veriler"
              description="Uygulama performansını analiz etmek için anonim veriler toplanır"
              value={analyticsData}
              onValueChange={setAnalyticsData}
              icon="bar-chart-outline"
            />
          </View>

          {/* Bildirimler */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, !isDarkMode && styles.lightSectionTitle]}>
              Bildirimler
            </Text>
            
            <PrivacyOption
              title="Push Bildirimleri"
              description="Şarj durumu ve önemli güncellemeler için bildirim alın"
              value={pushNotifications}
              onValueChange={setPushNotifications}
              icon="notifications-outline"
            />
            
            <PrivacyOption
              title="E-posta Bildirimleri"
              description="Promosyonlar ve haberler için e-posta bildirimleri alın"
              value={emailNotifications}
              onValueChange={setEmailNotifications}
              icon="mail-outline"
            />
          </View>

          {/* Üçüncü Taraf Paylaşım */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, !isDarkMode && styles.lightSectionTitle]}>
              Veri Paylaşımı
            </Text>
            
            <PrivacyOption
              title="Üçüncü Taraf Paylaşımı"
              description="Deneyimi kişiselleştirmek için verilerinizi güvenilir ortaklarla paylaşın"
              value={thirdPartySharing}
              onValueChange={setThirdPartySharing}
              icon="people-outline"
            />
          </View>

          {/* Hesap İşlemleri */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, !isDarkMode && styles.lightSectionTitle]}>
              Hesap İşlemleri
            </Text>
            
            <View style={[styles.actionContainer, !isDarkMode && styles.lightActionContainer]}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.exportButton]}
                onPress={() => {
                  Alert.alert('Veri İndirme', 'Verilerinizin indirilmesi için talep oluşturuldu. E-posta ile bilgilendirileceksiniz.');
                }}
              >
                <Ionicons name="download-outline" size={20} color={colors.primary} />
                <Text style={[styles.actionButtonText, { color: colors.primary }]}>
                  Verilerimi İndir
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => {
                  Alert.alert(
                    'Hesabı Sil',
                    'Bu işlem geri alınamaz. Tüm verileriniz kalıcı olarak silinecek.',
                    [
                      { text: 'İptal', style: 'cancel' },
                      { text: 'Sil', style: 'destructive', onPress: () => {
                        Alert.alert('Hesap Silme', 'Hesap silme talebi oluşturuldu. 24 saat içerisinde işleme alınacaktır.');
                      }}
                    ]
                  );
                }}
              >
                <Ionicons name="trash-outline" size={20} color={colors.error} />
                <Text style={[styles.actionButtonText, { color: colors.error }]}>
                  Hesabımı Sil
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Gizlilik Politikası */}
          <View style={styles.section}>
            <TouchableOpacity 
              style={[styles.linkButton, !isDarkMode && styles.lightLinkButton]}
              onPress={() => {
                // TODO: Gizlilik politikası sayfasına yönlendir
                Alert.alert('Gizlilik Politikası', 'Gizlilik politikası sayfasına yönlendirileceksiniz.');
              }}
            >
              <Ionicons name="document-text-outline" size={20} color={colors.primary} />
              <Text style={[styles.linkButtonText, !isDarkMode && styles.lightLinkButtonText]}>
                Gizlilik Politikasını Oku
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.gray500} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.linkButton, !isDarkMode && styles.lightLinkButton]}
              onPress={() => {
                // TODO: Kullanım şartları sayfasına yönlendir
                Alert.alert('Kullanım Şartları', 'Kullanım şartları sayfasına yönlendirileceksiniz.');
              }}
            >
              <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
              <Text style={[styles.linkButtonText, !isDarkMode && styles.lightLinkButtonText]}>
                Kullanım Şartları
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.gray500} />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  actionButton: {
    alignItems: 'center',
    borderRadius: 8,
    flexDirection: 'row',
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
  actionContainer: {
    backgroundColor: colors.gray900,
    borderColor: colors.gray800,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  closeButton: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  container: {
    backgroundColor: colors.black,
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  deleteButton: {
    backgroundColor: colors.error + '15',
  },
  exportButton: {
    backgroundColor: colors.primary + '15',
  },
  header: {
    alignItems: 'center',
    borderBottomColor: colors.gray800,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  iconContainer: {
    alignItems: 'center',
    backgroundColor: colors.primary + '15',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    marginRight: 12,
    width: 40,
  },
  lightActionContainer: {
    backgroundColor: colors.gray100,
    borderColor: colors.gray200,
  },
  lightContainer: {
    backgroundColor: colors.white,
  },
  lightHeader: {
    borderBottomColor: colors.gray200,
  },
  lightLinkButton: {
    backgroundColor: colors.gray100,
    borderColor: colors.gray200,
  },
  lightLinkButtonText: {
    color: colors.black,
  },
  lightOptionContainer: {
    backgroundColor: colors.gray100,
    borderColor: colors.gray200,
  },
  lightOptionDescription: {
    color: colors.gray600,
  },
  lightOptionTitle: {
    color: colors.black,
  },
  lightSectionTitle: {
    color: colors.black,
  },
  lightTitle: {
    color: colors.black,
  },
  linkButton: {
    alignItems: 'center',
    backgroundColor: colors.gray900,
    borderColor: colors.gray800,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 8,
    padding: 16,
  },
  linkButtonText: {
    color: colors.white,
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
  optionContainer: {
    backgroundColor: colors.gray900,
    borderColor: colors.gray800,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    padding: 16,
  },
  optionContent: {
    flex: 1,
    marginRight: 12,
  },
  optionDescription: {
    color: colors.gray400,
    fontSize: 14,
    lineHeight: 20,
  },
  optionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  optionTitle: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  title: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
});
