import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  Switch,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../constants/colors';

interface ProfileModalProps {
  visible: boolean;
  onClose: () => void;
  onToggleDarkMode: () => void;
  isDarkMode: boolean;
  onLogout: () => void;
  userLocation?: any;
  user?: any;
  onEditProfile?: () => void;
  onEditVehicles?: () => void;
  onEditFavorites?: () => void;
  onEditPrivacy?: () => void;
  onEditPrivacySettings?: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  visible,
  onClose,
  userLocation,
  isDarkMode,
  onToggleDarkMode,
  onLogout,
  user,
  onEditProfile,
  onEditVehicles,
  onEditFavorites,
  onEditPrivacy,
  onEditPrivacySettings,
}) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [fastChargingOnly, setFastChargingOnly] = useState(false);

  const userStats = {
    stationsVisited: 12,
    totalChargingSessions: 24,
    energyConsumed: 450, // kWh
    carbonSaved: 120, // kg CO2
  };

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
            <Ionicons name="close" size={24} color={isDarkMode ? colors.darkText : colors.lightText} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, !isDarkMode && styles.lightHeaderTitle]}>Profil</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Kullanıcı Profil Kartı */}
          <View style={styles.profileSection}>
            <View style={[styles.profileCard, !isDarkMode && styles.lightProfileCard]}>
              <View style={styles.profileHeader}>
                <View style={[styles.avatarContainer, !isDarkMode && styles.lightAvatarContainer]}>
                  <Ionicons name="person" size={36} color={colors.white} />
                  <View style={styles.statusIndicator} />
                </View>
                <View style={styles.userInfo}>
                  <Text style={[styles.displayName, !isDarkMode && styles.lightDisplayName]}>
                    {user?.name || 'Şarjet Kullanıcısı'}
                  </Text>
                  <Text style={[styles.emailText, !isDarkMode && styles.lightEmailText]}>
                    {user?.email || 'kullanici@sarjet.com'}
                  </Text>
                  {userLocation && (
                    <View style={styles.locationRow}>
                      <Ionicons name="location-outline" size={14} color={colors.primary} />
                      <Text style={[styles.locationText, !isDarkMode && styles.lightLocationText]}>
                        Konum aktif
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </View>

          {/* Araç Bilgileri */}
          {user?.userVehicles && user.userVehicles.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, !isDarkMode && styles.lightSectionTitle]}>Araçlarım</Text>
              {user.userVehicles.map((vehicle: any, index: number) => (
                <View key={index} style={[styles.modernVehicleCard, !isDarkMode && styles.lightModernVehicleCard]}>
                  <View style={styles.vehicleHeader}>
                    <View style={[styles.vehicleIcon, { backgroundColor: colors.primary + '15' }]}>
                      <Ionicons name="car-sport" size={20} color={colors.primary} />
                    </View>
                    <View style={styles.vehicleDetails}>
                      <Text style={[styles.vehicleTitle, !isDarkMode && styles.lightVehicleTitle]}>
                        {vehicle.nickname || `${vehicle.variant.model.brand.name} ${vehicle.variant.model.name}`}
                      </Text>
                      <Text style={[styles.vehicleSubtitle, !isDarkMode && styles.lightVehicleSubtitle]}>
                        {vehicle.variant.name} • {vehicle.variant.year}
                      </Text>
                    </View>
                    <View style={styles.batteryStatus}>
                      <Text style={[styles.batteryPercent, !isDarkMode && styles.lightBatteryPercent]}>
                        {vehicle.currentBatteryLevel || 100}%
                      </Text>
                      <View style={styles.batteryIndicator}>
                        <View 
                          style={[
                            styles.batteryFill, 
                            { width: `${vehicle.currentBatteryLevel || 100}%` }
                          ]} 
                        />
                      </View>
                    </View>
                  </View>
                  <View style={styles.modernVehicleSpecs}>
                    <View style={styles.specItem}>
                      <Ionicons name="battery-charging" size={16} color={colors.success} />
                      <Text style={[styles.specText, !isDarkMode && styles.lightSpecText]}>
                        {vehicle.variant.batteryCapacity} kWh
                      </Text>
                    </View>
                    <View style={styles.specItem}>
                      <Ionicons name="speedometer" size={16} color={colors.warning} />
                      <Text style={[styles.specText, !isDarkMode && styles.lightSpecText]}>
                        {vehicle.variant.maxRange} km
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Kişisel Bilgiler - Düzenleme */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, !isDarkMode && styles.lightSectionTitle]}>Kişisel Bilgiler</Text>
            
            <View style={[styles.modernCard, !isDarkMode && styles.lightModernCard]}>
              <TouchableOpacity 
                style={[styles.modernSettingItem, !isDarkMode && styles.lightModernSettingItem]}
                onPress={() => onEditProfile?.()}
              >
                <View style={styles.settingIconWrapper}>
                  <View style={[styles.settingIcon, { backgroundColor: colors.primary + '15' }]}>
                    <Ionicons name="person" size={18} color={colors.primary} />
                  </View>
                </View>
                <View style={styles.settingContent}>
                  <Text style={[styles.settingTitle, !isDarkMode && styles.lightSettingTitle]}>İsim ve Soyisim</Text>
                  <Text style={[styles.settingDescription, !isDarkMode && styles.lightSettingDescription]}>
                    {user?.name || 'Belirtilmemiş'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.gray500} />
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.modernSettingItem, !isDarkMode && styles.lightModernSettingItem]}
                onPress={() => onEditProfile?.()}
              >
                <View style={styles.settingIconWrapper}>
                  <View style={[styles.settingIcon, { backgroundColor: colors.secondary + '15' }]}>
                    <Ionicons name="mail" size={18} color={colors.secondary} />
                  </View>
                </View>
                <View style={styles.settingContent}>
                  <Text style={[styles.settingTitle, !isDarkMode && styles.lightSettingTitle]}>E-posta</Text>
                  <Text style={[styles.settingDescription, !isDarkMode && styles.lightSettingDescription]}>
                    {user?.email || 'Belirtilmemiş'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.gray500} />
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.modernSettingItem, !isDarkMode && styles.lightModernSettingItem]}
                onPress={() => onEditProfile?.()}
              >
                <View style={styles.settingIconWrapper}>
                  <View style={[styles.settingIcon, { backgroundColor: colors.success + '15' }]}>
                    <Ionicons name="call" size={18} color={colors.success} />
                  </View>
                </View>
                <View style={styles.settingContent}>
                  <Text style={[styles.settingTitle, !isDarkMode && styles.lightSettingTitle]}>Telefon</Text>
                  <Text style={[styles.settingDescription, !isDarkMode && styles.lightSettingDescription]}>
                    {user?.phone || 'Belirtilmemiş'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.gray500} />
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.modernSettingItem, { borderBottomWidth: 0 }, !isDarkMode && styles.lightModernSettingItem]}
                onPress={() => onEditProfile?.()}
              >
                <View style={styles.settingIconWrapper}>
                  <View style={[styles.settingIcon, { backgroundColor: colors.warning + '15' }]}>
                    <Ionicons name="key" size={18} color={colors.warning} />
                  </View>
                </View>
                <View style={styles.settingContent}>
                  <Text style={[styles.settingTitle, !isDarkMode && styles.lightSettingTitle]}>Şifre Değiştir</Text>
                  <Text style={[styles.settingDescription, !isDarkMode && styles.lightSettingDescription]}>
                    Güvenliğiniz için şifrenizi güncelleyin
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.gray500} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Ayarlar - Modern tasarım */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, !isDarkMode && styles.lightSectionTitle]}>Ayarlar</Text>
            
            <View style={[styles.modernCard, !isDarkMode && styles.lightModernCard]}>
              <View style={[styles.modernSettingItem, !isDarkMode && styles.lightModernSettingItem]}>
                <View style={styles.settingIconWrapper}>
                  <View style={[styles.settingIcon, { backgroundColor: colors.primary + '15' }]}>
                    <Ionicons name="notifications" size={18} color={colors.primary} />
                  </View>
                </View>
                <View style={styles.settingContent}>
                  <Text style={[styles.settingTitle, !isDarkMode && styles.lightSettingTitle]}>Bildirimler</Text>
                  <Text style={[styles.settingDescription, !isDarkMode && styles.lightSettingDescription]}>
                    Şarj durumu ve güncellemeler
                  </Text>
                </View>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                  trackColor={{ false: colors.gray400, true: colors.primary }}
                  thumbColor={colors.white}
                  style={styles.switchStyle}
                />
              </View>

              <View style={[styles.modernSettingItem, !isDarkMode && styles.lightModernSettingItem]}>
                <View style={styles.settingIconWrapper}>
                  <View style={[styles.settingIcon, { backgroundColor: colors.warning + '15' }]}>
                    <Ionicons name="flash" size={18} color={colors.warning} />
                  </View>
                </View>
                <View style={styles.settingContent}>
                  <Text style={[styles.settingTitle, !isDarkMode && styles.lightSettingTitle]}>Hızlı Şarj</Text>
                  <Text style={[styles.settingDescription, !isDarkMode && styles.lightSettingDescription]}>
                    Sadece DC hızlı şarj göster
                  </Text>
                </View>
                <Switch
                  value={fastChargingOnly}
                  onValueChange={setFastChargingOnly}
                  trackColor={{ false: colors.gray400, true: colors.warning }}
                  thumbColor={colors.white}
                  style={styles.switchStyle}
                />
              </View>

              <View style={[styles.modernSettingItem, { borderBottomWidth: 0 }, !isDarkMode && styles.lightModernSettingItem]}>
                <View style={styles.settingIconWrapper}>
                  <View style={[styles.settingIcon, { backgroundColor: colors.gray600 + '15' }]}>
                    <Ionicons name="moon" size={18} color={colors.gray600} />
                  </View>
                </View>
                <View style={styles.settingContent}>
                  <Text style={[styles.settingTitle, !isDarkMode && styles.lightSettingTitle]}>Karanlık Tema</Text>
                  <Text style={[styles.settingDescription, !isDarkMode && styles.lightSettingDescription]}>
                    Gece modu aktif
                  </Text>
                </View>
                <Switch
                  value={isDarkMode}
                  onValueChange={onToggleDarkMode}
                  trackColor={{ false: colors.gray400, true: colors.gray600 }}
                  thumbColor={colors.white}
                  style={styles.switchStyle}
                />
              </View>
            </View>
          </View>

          {/* Hesap Yönetimi */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, !isDarkMode && styles.lightSectionTitle]}>Hesap Yönetimi</Text>
            
            <View style={[styles.modernCard, !isDarkMode && styles.lightModernCard]}>
              <TouchableOpacity 
                style={[styles.modernSettingItem, !isDarkMode && styles.lightModernSettingItem]}
                onPress={() => onEditVehicles?.()}
              >
                <View style={styles.settingIconWrapper}>
                  <View style={[styles.settingIcon, { backgroundColor: colors.primary + '15' }]}>
                    <Ionicons name="car-sport" size={18} color={colors.primary} />
                  </View>
                </View>
                <View style={styles.settingContent}>
                  <Text style={[styles.settingTitle, !isDarkMode && styles.lightSettingTitle]}>Araçlarımı Yönet</Text>
                  <Text style={[styles.settingDescription, !isDarkMode && styles.lightSettingDescription]}>
                    Araç ekle, düzenle veya kaldır
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.gray500} />
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.modernSettingItem, !isDarkMode && styles.lightModernSettingItem]}
                onPress={() => onEditFavorites?.()}
              >
                <View style={styles.settingIconWrapper}>
                  <View style={[styles.settingIcon, { backgroundColor: colors.accent1 + '15' }]}>
                    <Ionicons name="heart" size={18} color={colors.accent1} />
                  </View>
                </View>
                <View style={styles.settingContent}>
                  <Text style={[styles.settingTitle, !isDarkMode && styles.lightSettingTitle]}>Favori İstasyonlar</Text>
                  <Text style={[styles.settingDescription, !isDarkMode && styles.lightSettingDescription]}>
                    Kaydettiğiniz şarj istasyonları
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.gray500} />
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.modernSettingItem, { borderBottomWidth: 0 }, !isDarkMode && styles.lightModernSettingItem]}
                onPress={() => onEditPrivacy?.()}
              >
                <View style={styles.settingIconWrapper}>
                  <View style={[styles.settingIcon, { backgroundColor: colors.secondary + '15' }]}>
                    <Ionicons name="shield-checkmark" size={18} color={colors.secondary} />
                  </View>
                </View>
                <View style={styles.settingContent}>
                  <Text style={[styles.settingTitle, !isDarkMode && styles.lightSettingTitle]}>Gizlilik Ayarları</Text>
                  <Text style={[styles.settingDescription, !isDarkMode && styles.lightSettingDescription]}>
                    Veri kullanımı ve gizlilik tercihleri
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.gray500} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Menü Öğeleri - Modern tasarım */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, !isDarkMode && styles.lightSectionTitle]}>Diğer</Text>
            
            <View style={[styles.modernCard, !isDarkMode && styles.lightModernCard]}>
              <TouchableOpacity style={[styles.modernMenuItem, !isDarkMode && styles.lightModernMenuItem]}>
                <View style={styles.settingIconWrapper}>
                  <View style={[styles.settingIcon, { backgroundColor: colors.error + '15' }]}>
                    <Ionicons name="heart" size={18} color={colors.error} />
                  </View>
                </View>
                <View style={styles.settingContent}>
                  <Text style={[styles.settingTitle, !isDarkMode && styles.lightSettingTitle]}>Favoriler</Text>
                  <Text style={[styles.settingDescription, !isDarkMode && styles.lightSettingDescription]}>
                    Kaydettiğiniz şarj istasyonları
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.gray500} />
              </TouchableOpacity>

              <TouchableOpacity style={[styles.modernMenuItem, !isDarkMode && styles.lightModernMenuItem]}>
                <View style={styles.settingIconWrapper}>
                  <View style={[styles.settingIcon, { backgroundColor: colors.success + '15' }]}>
                    <Ionicons name="help-circle" size={18} color={colors.success} />
                  </View>
                </View>
                <View style={styles.settingContent}>
                  <Text style={[styles.settingTitle, !isDarkMode && styles.lightSettingTitle]}>Yardım</Text>
                  <Text style={[styles.settingDescription, !isDarkMode && styles.lightSettingDescription]}>
                    Destek ve sıkça sorulan sorular
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.gray500} />
              </TouchableOpacity>

              <TouchableOpacity style={[styles.modernMenuItem, { borderBottomWidth: 0 }, !isDarkMode && styles.lightModernMenuItem]}>
                <View style={styles.settingIconWrapper}>
                  <View style={[styles.settingIcon, { backgroundColor: colors.gray600 + '15' }]}>
                    <Ionicons name="information-circle" size={18} color={colors.gray600} />
                  </View>
                </View>
                <View style={styles.settingContent}>
                  <Text style={[styles.settingTitle, !isDarkMode && styles.lightSettingTitle]}>Hakkında</Text>
                  <Text style={[styles.settingDescription, !isDarkMode && styles.lightSettingDescription]}>
                    Uygulama bilgileri ve sürüm
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.gray500} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Çıkış Yap - Modern tasarım */}
          <View style={styles.section}>
            <TouchableOpacity
              style={[styles.logoutCard, !isDarkMode && styles.lightLogoutCard]}
              onPress={onLogout}
            >
              <View style={styles.settingIconWrapper}>
                <View style={[styles.settingIcon, { backgroundColor: colors.error + '15' }]}>
                  <Ionicons name="log-out" size={18} color={colors.error} />
                </View>
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.logoutTitle, !isDarkMode && styles.lightLogoutTitle]}>Çıkış Yap</Text>
                <Text style={[styles.settingDescription, !isDarkMode && styles.lightSettingDescription]}>
                  Hesabınızdan güvenli çıkış yapın
                </Text>
              </View>
              <Ionicons name="arrow-forward" size={20} color={colors.error} />
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footerSection}>
            <Text style={[styles.appVersionText, !isDarkMode && styles.lightAppVersionText]}>
              Şarjet v1.0.0
            </Text>
            <Text style={[styles.copyrightText, !isDarkMode && styles.lightCopyrightText]}>
              © 2025 Şarjet. Tüm hakları saklıdır.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  closeButton: {
    padding: 8,
  },
  container: {
    backgroundColor: colors.darkBg,
    flex: 1,
  },
  header: {
    alignItems: 'center',
    borderBottomColor: colors.gray600,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    color: colors.darkText,
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    color: colors.darkText,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statCard: {
    alignItems: 'center',
    backgroundColor: colors.darkCard,
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 6,
    padding: 16,
  },
  statNumber: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    color: colors.gray400,
    fontSize: 12,
    textAlign: 'center',
  },
  settingItem: {
    alignItems: 'center',
    borderBottomColor: colors.gray600,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  settingLeft: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  settingText: {
    color: colors.darkText,
    fontSize: 16,
    marginLeft: 12,
  },
  menuItem: {
    alignItems: 'center',
    borderBottomColor: colors.gray600,
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingVertical: 16,
  },
  menuText: {
    color: colors.darkText,
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
  },
  logoutButton: {
    alignItems: 'center',
    backgroundColor: colors.darkCard,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
    paddingVertical: 16,
  },
  logoutButtonText: {
    color: colors.error,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  footer: {
    alignItems: 'center',
    marginTop: 24,
    paddingVertical: 24,
  },
  appVersion: {
    color: colors.gray400,
    fontSize: 14,
    marginBottom: 4,
  },
  copyright: {
    color: colors.gray500,
    fontSize: 12,
    textAlign: 'center',
  },
  // Light theme styles
  lightContainer: {
    backgroundColor: colors.lightBg,
  },
  lightHeader: {
    borderBottomColor: colors.gray300,
  },
  lightHeaderTitle: {
    color: colors.lightText,
  },
  lightSectionTitle: {
    color: colors.lightText,
  },
  lightUserName: {
    color: colors.lightText,
  },
  lightUserEmail: {
    color: colors.gray600,
  },
  lightSettingItem: {
    borderBottomColor: colors.gray300,
  },
  lightSettingText: {
    color: colors.lightText,
  },
  lightStatCard: {
    backgroundColor: colors.lightCard,
  },
  lightStatLabel: {
    color: colors.gray600,
  },
  vehicleCard: {
    alignItems: 'center',
    backgroundColor: colors.darkCard,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    padding: 16,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: {
    color: colors.darkText,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  vehicleModel: {
    color: colors.gray400,
    fontSize: 12,
    marginBottom: 2,
  },
  vehicleSpecs: {
    color: colors.gray600,
    fontSize: 12,
  },
  batteryIndicator: {
    alignItems: 'flex-end',
  },
  batteryLevel: {
    color: colors.darkText,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  batteryBar: {
    backgroundColor: colors.gray500,
    borderRadius: 5,
    height: 8,
    width: 50,
  },
  batteryFill: {
    backgroundColor: colors.primary,
    borderRadius: 5,
    height: '100%',
  },
  lightVehicleCard: {
    backgroundColor: colors.lightCard,
  },
  lightVehicleName: {
    color: colors.lightText,
  },
  lightVehicleModel: {
    color: colors.gray500,
  },
  lightVehicleSpecs: {
    color: colors.gray600,
  },
  
  // Yeni Modern Profil Tasarımı
  profileSection: {
    marginTop: 16,
    marginBottom: 8,
  },
  profileCard: {
    backgroundColor: colors.darkCard,
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 4,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  lightProfileCard: {
    backgroundColor: colors.lightCard,
    shadowColor: colors.gray600,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginRight: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  lightAvatarContainer: {
    shadowColor: colors.primary,
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.success,
    borderWidth: 3,
    borderColor: colors.white,
  },
  userInfo: {
    flex: 1,
  },
  displayName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.darkText,
    marginBottom: 4,
  },
  lightDisplayName: {
    color: colors.lightText,
  },
  emailText: {
    fontSize: 14,
    color: colors.gray400,
    marginBottom: 6,
  },
  lightEmailText: {
    color: colors.gray600,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 13,
    color: colors.primary,
    marginLeft: 4,
    fontWeight: '600',
  },
  lightLocationText: {
    color: colors.primary,
  },
  
  // Modern Araç Kartları
  modernVehicleCard: {
    backgroundColor: colors.darkCard,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lightModernVehicleCard: {
    backgroundColor: colors.lightCard,
    shadowColor: colors.gray400,
  },
  vehicleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  vehicleIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  vehicleDetails: {
    flex: 1,
  },
  vehicleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.darkText,
    marginBottom: 2,
  },
  lightVehicleTitle: {
    color: colors.lightText,
  },
  vehicleSubtitle: {
    fontSize: 13,
    color: colors.gray400,
  },
  lightVehicleSubtitle: {
    color: colors.gray600,
  },
  batteryStatus: {
    alignItems: 'flex-end',
  },
  batteryPercent: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.darkText,
    marginBottom: 4,
  },
  lightBatteryPercent: {
    color: colors.lightText,
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  specText: {
    fontSize: 12,
    color: colors.gray400,
    marginLeft: 4,
  },
  lightSpecText: {
    color: colors.gray600,
  },
  modernVehicleSpecs: {
    flexDirection: 'row',
    marginTop: 8,
  },
  
  // Modern Kartlar
  modernCard: {
    backgroundColor: colors.darkCard,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lightModernCard: {
    backgroundColor: colors.lightCard,
    shadowColor: colors.gray400,
  },
  
  // Modern Ayar Öğeleri
  modernSettingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray700,
  },
  lightModernSettingItem: {
    borderBottomColor: colors.gray200,
  },
  modernMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray700,
  },
  lightModernMenuItem: {
    borderBottomColor: colors.gray200,
  },
  settingIconWrapper: {
    marginRight: 12,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.darkText,
    marginBottom: 2,
  },
  lightSettingTitle: {
    color: colors.lightText,
  },
  settingDescription: {
    fontSize: 13,
    color: colors.gray400,
    lineHeight: 16,
  },
  lightSettingDescription: {
    color: colors.gray600,
  },
  switchStyle: {
    transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }],
  },
  
  // Modern Çıkış Kartı
  logoutCard: {
    backgroundColor: colors.error + '08',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.error + '20',
    shadowColor: colors.error,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  lightLogoutCard: {
    backgroundColor: colors.error + '05',
    borderColor: colors.error + '15',
  },
  logoutTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.error,
    marginBottom: 2,
  },
  lightLogoutTitle: {
    color: colors.error,
  },
  
  // Footer
  footerSection: {
    alignItems: 'center',
    paddingVertical: 24,
    marginTop: 8,
  },
  appVersionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray400,
    marginBottom: 4,
  },
  lightAppVersionText: {
    color: colors.gray600,
  },
  copyrightText: {
    fontSize: 12,
    color: colors.gray500,
    textAlign: 'center',
  },
  lightCopyrightText: {
    color: colors.gray600,
  },
});