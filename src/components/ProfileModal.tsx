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
  userLocation: { latitude: number; longitude: number } | null;
  isDarkMode: boolean;
  onToggleDarkMode: (isDark: boolean) => void;
  onLogout: () => void;
  user?: any;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  visible,
  onClose,
  userLocation,
  isDarkMode,
  onToggleDarkMode,
  onLogout,
  user,
}) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [fastChargingOnly, setFastChargingOnly] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'history'>('profile');

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
          <Text style={[styles.headerTitle, !isDarkMode && styles.lightHeaderTitle]}>
            {activeTab === 'profile' ? 'Profil' : 'Geçmiş'}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'profile' && styles.activeTab]}
            onPress={() => setActiveTab('profile')}
          >
            <Text style={[styles.tabText, activeTab === 'profile' && styles.activeTabText]}>
              Profil
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'history' && styles.activeTab]}
            onPress={() => setActiveTab('history')}
          >
            <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
              Geçmiş
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {activeTab === 'profile' ? (
            <>
              {/* Kullanıcı Bilgileri */}
              <View style={styles.section}>
                <View style={styles.userInfo}>
                  <View style={styles.avatar}>
                    <Ionicons name="person" size={40} color={colors.white} />
                  </View>
                  <View style={styles.userDetails}>
                    <Text style={[styles.userName, !isDarkMode && styles.lightUserName]}>
                      {user?.name || 'Şarjet Kullanıcısı'}
                    </Text>
                    <Text style={[styles.userEmail, !isDarkMode && styles.lightUserEmail]}>
                      {user?.email || 'kullanici@sarjet.com'}
                    </Text>
                    {userLocation && (
                      <Text style={styles.userLocation}>
                        📍 {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
                      </Text>
                    )}
                  </View>
                </View>
              </View>

              {/* Araç Bilgileri */}
              {user?.userVehicles && user.userVehicles.length > 0 && (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, !isDarkMode && styles.lightSectionTitle]}>Araçlarım</Text>
                  {user.userVehicles.map((vehicle: any, index: number) => (
                    <View key={index} style={[styles.vehicleCard, !isDarkMode && styles.lightVehicleCard]}>
                      <View style={styles.vehicleInfo}>
                        <Text style={[styles.vehicleName, !isDarkMode && styles.lightVehicleName]}>
                          {vehicle.nickname || `${vehicle.variant.model.brand.name} ${vehicle.variant.model.name}`}
                        </Text>
                        <Text style={[styles.vehicleModel, !isDarkMode && styles.lightVehicleModel]}>
                          {vehicle.variant.name} ({vehicle.variant.year})
                        </Text>
                        <Text style={[styles.vehicleSpecs, !isDarkMode && styles.lightVehicleSpecs]}>
                          {vehicle.variant.batteryCapacity} kWh • {vehicle.variant.maxRange} km
                        </Text>
                      </View>
                      <View style={styles.batteryIndicator}>
                        <Text style={styles.batteryLevel}>{vehicle.currentBatteryLevel || 100}%</Text>
                        <View style={styles.batteryBar}>
                          <View 
                            style={[
                              styles.batteryFill, 
                              { width: `${vehicle.currentBatteryLevel || 100}%` }
                            ]} 
                          />
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* İstatistikler */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, !isDarkMode && styles.lightSectionTitle]}>İstatistiklerim</Text>
                
                <View style={styles.statsGrid}>
                  <View style={[styles.statCard, !isDarkMode && styles.lightStatCard]}>
                    <Text style={styles.statNumber}>{userStats.stationsVisited}</Text>
                    <Text style={[styles.statLabel, !isDarkMode && styles.lightStatLabel]}>Ziyaret Edilen İstasyon</Text>
                  </View>
                  
                  <View style={[styles.statCard, !isDarkMode && styles.lightStatCard]}>
                    <Text style={styles.statNumber}>{userStats.totalChargingSessions}</Text>
                    <Text style={[styles.statLabel, !isDarkMode && styles.lightStatLabel]}>Şarj Seansı</Text>
                  </View>
                </View>

                <View style={styles.statsGrid}>
                  <View style={[styles.statCard, !isDarkMode && styles.lightStatCard]}>
                    <Text style={styles.statNumber}>{userStats.energyConsumed}</Text>
                    <Text style={[styles.statLabel, !isDarkMode && styles.lightStatLabel]}>kWh Enerji</Text>
                  </View>
                  
                  <View style={[styles.statCard, !isDarkMode && styles.lightStatCard]}>
                    <Text style={styles.statNumber}>{userStats.carbonSaved}</Text>
                    <Text style={[styles.statLabel, !isDarkMode && styles.lightStatLabel]}>kg CO₂ Tasarruf</Text>
                  </View>
                </View>
              </View>

              {/* Ayarlar */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, !isDarkMode && styles.lightSectionTitle]}>Ayarlar</Text>
                
                <View style={[styles.settingItem, !isDarkMode && styles.lightSettingItem]}>
                  <View style={styles.settingLeft}>
                    <Ionicons name="notifications-outline" size={20} color={colors.primary} />
                    <Text style={[styles.settingText, !isDarkMode && styles.lightSettingText]}>Bildirimler</Text>
                  </View>
                  <Switch
                    value={notificationsEnabled}
                    onValueChange={setNotificationsEnabled}
                    trackColor={{ false: colors.gray500, true: colors.primary }}
                    thumbColor={notificationsEnabled ? colors.white : colors.gray200}
                  />
                </View>

                <View style={[styles.settingItem, !isDarkMode && styles.lightSettingItem]}>
                  <View style={styles.settingLeft}>
                    <Ionicons name="flash-outline" size={20} color={colors.primary} />
                    <Text style={[styles.settingText, !isDarkMode && styles.lightSettingText]}>Sadece Hızlı Şarj</Text>
                  </View>
                  <Switch
                    value={fastChargingOnly}
                    onValueChange={setFastChargingOnly}
                    trackColor={{ false: colors.gray500, true: colors.primary }}
                    thumbColor={fastChargingOnly ? colors.white : colors.gray200}
                  />
                </View>

                <View style={[styles.settingItem, !isDarkMode && styles.lightSettingItem]}>
                  <View style={styles.settingLeft}>
                    <Ionicons name="moon-outline" size={20} color={colors.primary} />
                    <Text style={[styles.settingText, !isDarkMode && styles.lightSettingText]}>Karanlık Tema</Text>
                  </View>
                  <Switch
                    value={isDarkMode}
                    onValueChange={onToggleDarkMode}
                    trackColor={{ false: colors.gray500, true: colors.primary }}
                    thumbColor={isDarkMode ? colors.white : colors.gray200}
                  />
                </View>
              </View>

              {/* Menü Öğeleri */}
              <View style={styles.section}>
                <TouchableOpacity 
                  style={styles.menuItem}
                  onPress={() => setActiveTab('history')}
                >
                  <Ionicons name="time-outline" size={20} color={colors.primary} />
                  <Text style={[styles.menuText, !isDarkMode && styles.lightSettingText]}>Şarj Geçmişi</Text>
                  <Ionicons name="chevron-forward" size={20} color={colors.gray500} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem}>
                  <Ionicons name="heart-outline" size={20} color={colors.primary} />
                  <Text style={[styles.menuText, !isDarkMode && styles.lightSettingText]}>Favori İstasyonlarım</Text>
                  <Ionicons name="chevron-forward" size={20} color={colors.gray500} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem}>
                  <Ionicons name="help-circle-outline" size={20} color="#00C853" />
                  <Text style={[styles.menuText, !isDarkMode && styles.lightSettingText]}>Yardım & Destek</Text>
                  <Ionicons name="chevron-forward" size={20} color="#B0BEC5" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem}>
                  <Ionicons name="information-circle-outline" size={20} color="#00C853" />
                  <Text style={[styles.menuText, !isDarkMode && styles.lightSettingText]}>Hakkında</Text>
                  <Ionicons name="chevron-forward" size={20} color="#B0BEC5" />
                </TouchableOpacity>
              </View>

              {/* Çıkış Yap Butonu */}
              <View style={styles.section}>
                <TouchableOpacity
                  style={styles.logoutButton}
                  onPress={onLogout}
                >
                  <Ionicons name="log-out-outline" size={20} color={colors.error} />
                  <Text style={styles.logoutButtonText}>Çıkış Yap</Text>
                </TouchableOpacity>
              </View>

              {/* Uygulama Bilgisi */}
              <View style={styles.footer}>
                <Text style={styles.appVersion}>Şarjet v1.0.0</Text>
                <Text style={styles.copyright}>© 2025 Şarjet. Tüm hakları saklıdır.</Text>
              </View>
            </>
          ) : (
            /* Geçmiş Sekmesi */
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, !isDarkMode && styles.lightSectionTitle]}>
                Şarj Geçmişi
              </Text>
              <Text style={[styles.noHistoryText, !isDarkMode && styles.lightNoHistoryText]}>
                Henüz şarj geçmişi bulunmamaktadır.
              </Text>
            </View>
          )}
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
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.gray600,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 16,
    color: colors.gray400,
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: '600',
  },
  noHistoryText: {
    color: colors.gray400,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 50,
  },
  lightNoHistoryText: {
    color: colors.gray600,
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
  userInfo: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 40,
    height: 80,
    justifyContent: 'center',
    marginRight: 16,
    width: 80,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    color: colors.darkText,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    color: colors.gray400,
    fontSize: 14,
    marginBottom: 4,
  },
  userLocation: {
    color: colors.primary,
    fontSize: 12,
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
});