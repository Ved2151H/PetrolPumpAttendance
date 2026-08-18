import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Dimensions } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Users, UserCheck, UserX, Activity, AlertCircle } from 'lucide-react-native';
import { BarChart } from 'react-native-chart-kit';
import { dashboardService } from '../../services/api/dashboard';
import { attendanceService } from '../../services/api/attendance';
import { useNavigation } from '@react-navigation/native';

export default function DashboardScreen() {
  const navigation = useNavigation<any>();
  const [refreshing, setRefreshing] = useState(false);

  const { data: stats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardService.getStats
  });

  const { data: todayAttendance, isLoading: attLoading, error: attError, refetch: refetchAtt } = useQuery({
    queryKey: ['attendance', new Date().toISOString().split('T')[0]],
    queryFn: () => attendanceService.getByDate(new Date().toISOString().split('T')[0])
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchStats(), refetchAtt()]);
    setRefreshing(false);
  }, [refetchStats, refetchAtt]);

  const isLoading = statsLoading || attLoading;
  const error = statsError || attError;

  const statCards = stats ? [
    { title: "Total Workers", value: stats.totalWorkers, icon: Users, color: "#2563eb", bg: "bg-blue-50" },
    { title: "Present Today", value: stats.presentToday, icon: UserCheck, color: "#16a34a", bg: "bg-green-50" },
    { title: "Absent Today", value: stats.absentToday, icon: UserX, color: "#dc2626", bg: "bg-red-50" },
    { title: "Attendance", value: `${stats.attendanceRate}%`, icon: Activity, color: "#d97706", bg: "bg-amber-50" },
  ] : [];

  const chartData = {
    labels: stats?.weeklyStats?.map((s: any) => new Date(s.date).toLocaleDateString('en-US', { weekday: 'short' })) || [],
    datasets: [
      {
        data: stats?.weeklyStats?.map((s: any) => s.present) || [],
      }
    ]
  };

  if (isLoading && !refreshing) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <Text className="text-gray-500 mt-4 font-medium">Loading dashboard...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 p-6">
        <AlertCircle color="#b91c1c" size={48} className="mb-4" />
        <Text className="text-center text-red-700 font-bold mb-4">Unable to load dashboard</Text>
        <TouchableOpacity onPress={onRefresh} className="px-6 py-3 bg-green-600 rounded-xl">
          <Text className="text-white font-bold">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView 
      className="flex-1 bg-gray-50"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#16a34a']} />}
    >
      <View className="p-4 space-y-6">
        <View>
          <Text className="text-2xl font-bold text-gray-900">Dashboard</Text>
          <Text className="text-gray-500">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
        </View>

        {/* Stats Grid */}
        <View className="flex-row flex-wrap justify-between">
          {statCards.map((stat, idx) => (
            <View key={idx} className="w-[48%] bg-white p-4 rounded-2xl mb-4 shadow-sm border border-gray-100">
              <View className={`w-10 h-10 rounded-full items-center justify-center mb-3 ${stat.bg}`}>
                <stat.icon color={stat.color} size={20} />
              </View>
              <Text className="text-gray-500 text-sm font-medium mb-1">{stat.title}</Text>
              <Text className="text-2xl font-bold text-gray-900">{stat.value}</Text>
            </View>
          ))}
        </View>

        {/* Weekly Graph */}
        {stats?.weeklyStats && stats.weeklyStats.length > 0 && (
          <View className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <Text className="text-lg font-bold text-gray-900 mb-4">Weekly Attendance (Present)</Text>
            <BarChart
              data={chartData}
              width={Dimensions.get('window').width - 64}
              height={220}
              yAxisLabel=""
              yAxisSuffix=""
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(22, 163, 74, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                style: { borderRadius: 16 },
                barPercentage: 0.6,
              }}
              style={{ marginVertical: 8, borderRadius: 16 }}
              showValuesOnTopOfBars
            />
          </View>
        )}

        {/* Today's Attendance Preview */}
        <View className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-8">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-bold text-gray-900">Today's Attendance</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Attendance')}>
              <Text className="text-green-700 font-bold text-sm">View All</Text>
            </TouchableOpacity>
          </View>

          {(!todayAttendance || todayAttendance.length === 0) ? (
            <Text className="text-gray-500 text-center py-4">No records for today</Text>
          ) : (
            <View className="space-y-3">
              {todayAttendance.slice(0, 5).map((record: any) => (
                <View key={record.id} className="flex-row justify-between items-center p-3 border border-gray-100 rounded-xl">
                  <Text className="font-bold text-gray-900">{record.worker?.name || 'Unknown'}</Text>
                  <View className={`px-3 py-1 rounded-full ${record.status === 'PRESENT' ? 'bg-green-100' : 'bg-red-100'}`}>
                    <Text className={`text-xs font-bold ${record.status === 'PRESENT' ? 'text-green-700' : 'text-red-700'}`}>
                      {record.status}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}
