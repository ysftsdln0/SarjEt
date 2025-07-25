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
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  visible,
  onClose,
  userLocation,
}) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [fastChargingOnly, setFastChargingOnly] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

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
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.darkText} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profil</Text>
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
                <Text style={styles.userName}>Şarjet Kullanıcısı</Text>
                <Text style={styles.userEmail}>kullanici@sarjet.com</Text>
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
            <Text style={styles.sectionTitle}>İstatistiklerim</Text>
            
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{userStats.stationsVisited}</Text>
                <Text style={styles.statLabel}>Ziyaret Edilen İstasyon</Text>
              </View>
              
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{userStats.totalChargingSessions}</Text>
                <Text style={styles.statLabel}>Şarj Seansı</Text>
              </View>
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{userStats.energyConsumed}</Text>
                <Text style={styles.statLabel}>kWh Enerji</Text>
              </View>
              
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{userStats.carbonSaved}</Text>
                <Text style={styles.statLabel}>kg CO₂ Tasarruf</Text>
              </View>
            </View>
          </View>

          {/* Ayarlar */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ayarlar</Text>
            
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="notifications-outline" size={20} color={colors.primary} />
                <Text style={styles.settingText}>Bildirimler</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: colors.gray500, true: colors.primary }}
                thumbColor={notificationsEnabled ? colors.white : colors.gray200}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="flash-outline" size={20} color={colors.primary} />
                <Text style={styles.settingText}>Sadece Hızlı Şarj</Text>
              </View>
              <Switch
                value={fastChargingOnly}
                onValueChange={setFastChargingOnly}
                trackColor={{ false: colors.gray500, true: colors.primary }}
                thumbColor={fastChargingOnly ? colors.white : colors.gray200}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="moon-outline" size={20} color={colors.primary} />
                <Text style={styles.settingText}>Karanlık Tema</Text>
              </View>
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: colors.gray500, true: colors.primary }}
                thumbColor={darkMode ? colors.white : colors.gray200}
              />
            </View>
          </View>

          {/* Menü Öğeleri */}
          <View style={styles.section}>
            <TouchableOpacity style={styles.menuItem}>
              <Ionicons name="heart-outline" size={20} color={colors.primary} />
              <Text style={styles.menuText}>Favori İstasyonlarım</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.gray500} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <Ionicons name="time-outline" size={20} color={colors.primary} />
              <Text style={styles.menuText}>Şarj Geçmişi</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.gray500} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <Ionicons name="card-outline" size={20} color="#00C853" />
              <Text style={styles.menuText}>Ödeme Yöntemleri</Text>
              <Ionicons name="chevron-forward" size={20} color="#B0BEC5" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <Ionicons name="help-circle-outline" size={20} color="#00C853" />
              <Text style={styles.menuText}>Yardım & Destek</Text>
              <Ionicons name="chevron-forward" size={20} color="#B0BEC5" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <Ionicons name="information-circle-outline" size={20} color="#00C853" />
              <Text style={styles.menuText}>Hakkında</Text>
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
});
