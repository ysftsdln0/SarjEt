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
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  visible,
  onClose,
  userLocation,
  isDarkMode,
  onToggleDarkMode,
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
          {/* Kullanıcı Bilgileri */}
          <View style={styles.section}>
            <View style={styles.userInfo}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={40} color={colors.white} />
              </View>
              <View style={styles.userDetails}>
                <Text style={[styles.userName, !isDarkMode && styles.lightUserName]}>Şarjet Kullanıcısı</Text>
                <Text style={[styles.userEmail, !isDarkMode && styles.lightUserEmail]}>kullanici@sarjet.com</Text>
                {userLocation && (
                  <Text style={styles.userLocation}>
                    📍 {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
                  </Text>
                )}
              </View>
            </View>
          </View>

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

          {/* Çıkış Yap */}
          <View style={styles.section}>
            <TouchableOpacity style={styles.logoutButton}>
              <Ionicons name="log-out-outline" size={20} color="#FF5722" />
              <Text style={styles.logoutText}>Çıkış Yap</Text>
            </TouchableOpacity>
          </View>

          {/* Uygulama Bilgisi */}
          <View style={styles.footer}>
            <Text style={styles.appVersion}>Şarjet v1.0.0</Text>
            <Text style={styles.copyright}>© 2025 Şarjet. Tüm hakları saklıdır.</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.darkBg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray600,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.darkText,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.darkText,
    marginBottom: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.darkText,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: colors.gray400,
    marginBottom: 4,
  },
  userLocation: {
    fontSize: 12,
    color: colors.primary,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.darkCard,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.gray400,
    textAlign: 'center',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray600,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 16,
    color: colors.darkText,
    marginLeft: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray600,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: colors.darkText,
    marginLeft: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.darkCard,
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.error,
    marginLeft: 8,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
    marginTop: 24,
  },
  appVersion: {
    fontSize: 14,
    color: colors.gray400,
    marginBottom: 4,
  },
  copyright: {
    fontSize: 12,
    color: colors.gray500,
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
});
