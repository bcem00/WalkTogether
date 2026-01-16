import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { Colors } from '../../constants/theme';
import { eventsApi } from '../apiClient';

interface SystemLog {
  logId: string;
  userId: string | null;
  actionType: string;
  tableName: string;
  recordId: string | null;
  oldData: any;
  newData: any;
  severity: string;
  createdAt: string;
}

const SEVERITY_COLORS: Record<string, string> = {
  INFO: '#17a2b8',
  WARN: '#ffc107',
  ERROR: '#dc3545',
};

const ACTION_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  INSERT: 'add-circle-outline',
  UPDATE: 'create-outline',
  DELETE: 'trash-outline',
};

export default function SystemLogsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = isDark ? Colors.dark : Colors.light;
  const router = useRouter();

  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<SystemLog | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Filters
  const [filterSeverity, setFilterSeverity] = useState<string | null>(null);
  const [filterTable, setFilterTable] = useState<string | null>(null);

  const tables = ['users', 'events', 'routes', 'destinations', 'attendances'];
  const severities = ['INFO', 'WARN', 'ERROR'];

  useEffect(() => {
    loadLogs();
  }, [filterSeverity, filterTable]);

  const loadLogs = async () => {
    setLoading(true);
    const result = await eventsApi.getSystemLogs(100, filterSeverity || undefined, filterTable || undefined);
    if (result.data) {
      setLogs(result.data);
    }
    setLoading(false);
  };

  const openLogDetails = (log: SystemLog) => {
    setSelectedLog(log);
    setModalVisible(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderLogItem = ({ item }: { item: SystemLog }) => (
    <TouchableOpacity
      style={[styles.logCard, { backgroundColor: themeColors.inputBackground, borderLeftColor: SEVERITY_COLORS[item.severity] || '#888' }]}
      onPress={() => openLogDetails(item)}
    >
      <View style={styles.logHeader}>
        <Ionicons 
          name={ACTION_ICONS[item.actionType] || 'ellipse-outline'} 
          size={20} 
          color={themeColors.tint} 
        />
        <Text style={[styles.actionType, { color: themeColors.text }]}>{item.actionType}</Text>
        <View style={[styles.severityBadge, { backgroundColor: SEVERITY_COLORS[item.severity] || '#888' }]}>
          <Text style={styles.severityText}>{item.severity}</Text>
        </View>
      </View>
      <Text style={[styles.tableName, { color: themeColors.tint }]}>Tablo: {item.tableName}</Text>
      <Text style={[styles.timestamp, { color: themeColors.placeholder }]}>{formatDate(item.createdAt)}</Text>
    </TouchableOpacity>
  );

  const FilterChip = ({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) => (
    <TouchableOpacity
      style={[styles.filterChip, active && { backgroundColor: themeColors.tint }]}
      onPress={onPress}
    >
      <Text style={[styles.filterChipText, active && { color: '#fff' }]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>Sistem Logları</Text>
        <TouchableOpacity onPress={loadLogs} style={styles.refreshButton}>
          <Ionicons name="refresh" size={22} color={themeColors.tint} />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <Text style={[styles.filterLabel, { color: themeColors.placeholder }]}>Seviye:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          <FilterChip label="Tümü" active={!filterSeverity} onPress={() => setFilterSeverity(null)} />
          {severities.map((s) => (
            <FilterChip key={s} label={s} active={filterSeverity === s} onPress={() => setFilterSeverity(s)} />
          ))}
        </ScrollView>

        <Text style={[styles.filterLabel, { color: themeColors.placeholder, marginTop: 10 }]}>Tablo:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          <FilterChip label="Tümü" active={!filterTable} onPress={() => setFilterTable(null)} />
          {tables.map((t) => (
            <FilterChip key={t} label={t} active={filterTable === t} onPress={() => setFilterTable(t)} />
          ))}
        </ScrollView>
      </View>

      {/* Logs List */}
      {loading ? (
        <ActivityIndicator size="large" color={themeColors.tint} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={logs}
          renderItem={renderLogItem}
          keyExtractor={(item) => item.logId}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: themeColors.placeholder }]}>
              Log bulunamadı.
            </Text>
          }
        />
      )}

      {/* Log Detail Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>Log Detayı</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={themeColors.text} />
              </TouchableOpacity>
            </View>

            {selectedLog && (
              <ScrollView style={styles.modalBody}>
                <DetailRow label="Log ID" value={selectedLog.logId} themeColors={themeColors} />
                <DetailRow label="İşlem" value={selectedLog.actionType} themeColors={themeColors} />
                <DetailRow label="Tablo" value={selectedLog.tableName} themeColors={themeColors} />
                <DetailRow label="Seviye" value={selectedLog.severity} themeColors={themeColors} />
                <DetailRow label="Kullanıcı ID" value={selectedLog.userId || 'Bilinmiyor'} themeColors={themeColors} />
                <DetailRow label="Tarih" value={formatDate(selectedLog.createdAt)} themeColors={themeColors} />

                {selectedLog.oldData && (
                  <View style={styles.dataSection}>
                    <Text style={[styles.dataLabel, { color: themeColors.tint }]}>Eski Veri:</Text>
                    <View style={[styles.dataBox, { backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5' }]}>
                      <Text style={[styles.dataText, { color: themeColors.text }]}>
                        {JSON.stringify(selectedLog.oldData, null, 2)}
                      </Text>
                    </View>
                  </View>
                )}

                {selectedLog.newData && (
                  <View style={styles.dataSection}>
                    <Text style={[styles.dataLabel, { color: themeColors.tint }]}>Yeni Veri:</Text>
                    <View style={[styles.dataBox, { backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5' }]}>
                      <Text style={[styles.dataText, { color: themeColors.text }]}>
                        {JSON.stringify(selectedLog.newData, null, 2)}
                      </Text>
                    </View>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const DetailRow = ({ label, value, themeColors }: { label: string; value: string; themeColors: any }) => (
  <View style={styles.detailRow}>
    <Text style={[styles.detailLabel, { color: themeColors.placeholder }]}>{label}:</Text>
    <Text style={[styles.detailValue, { color: themeColors.text }]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: { padding: 8 },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: 'bold', marginLeft: 8 },
  refreshButton: { padding: 8 },
  filtersContainer: { paddingHorizontal: 16, paddingBottom: 10 },
  filterLabel: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
  filterRow: { flexDirection: 'row' },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 16,
    marginRight: 8,
  },
  filterChipText: { fontSize: 12, fontWeight: '500', color: '#333' },
  logCard: {
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    borderLeftWidth: 4,
  },
  logHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  actionType: { fontSize: 14, fontWeight: 'bold', marginLeft: 8, flex: 1 },
  severityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  severityText: { fontSize: 10, fontWeight: 'bold', color: '#fff' },
  tableName: { fontSize: 12, marginBottom: 4 },
  timestamp: { fontSize: 11 },
  emptyText: { textAlign: 'center', marginTop: 50, fontSize: 14 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  modalBody: { padding: 16 },
  detailRow: { flexDirection: 'row', marginBottom: 10 },
  detailLabel: { width: 100, fontSize: 13 },
  detailValue: { flex: 1, fontSize: 13, fontWeight: '500' },
  dataSection: { marginTop: 16 },
  dataLabel: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  dataBox: { padding: 10, borderRadius: 8 },
  dataText: { fontSize: 11, fontFamily: 'monospace' },
});
