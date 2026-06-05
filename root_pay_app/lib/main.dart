import 'package:flutter/material.dart';
import 'package:notification_listener_service/notification_listener_service.dart';
import 'package:flutter_background_service/flutter_background_service.dart';
import 'package:workmanager/workmanager.dart';

import 'background_gateway.dart';
import 'sync_worker.dart';
import 'database_helper.dart';

Future<void> initializeBackgroundService() async {
  final service = FlutterBackgroundService();

  await service.configure(
    androidConfiguration: AndroidConfiguration(
      onStart: onStart,
      autoStart: false,
      isForegroundMode: true,
      notificationChannelId: 'gateway_channel',
      initialNotificationTitle: 'Root-Pay Gateway',
      initialNotificationContent: 'Listening for UPI transactions',
      foregroundServiceNotificationId: 888,
    ),
    iosConfiguration: IosConfiguration(
      autoStart: false,
      onForeground: onStart,
    ),
  );
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  Workmanager().initialize(callbackDispatcher, isInDebugMode: false);
  Workmanager().registerPeriodicTask(
    "1", 
    "offlineSyncTask", 
    frequency: const Duration(minutes: 15),
    constraints: Constraints(networkType: NetworkType.connected),
  );

  await initializeBackgroundService();

  runApp(const RootPayApp());
}

class RootPayApp extends StatelessWidget {
  const RootPayApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Root-Pay Gateway',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        scaffoldBackgroundColor: const Color(0xFFF8F9FB),
        fontFamily: 'Roboto',
      ),
      home: const GatewayScreen(),
    );
  }
}

class GatewayScreen extends StatefulWidget {
  const GatewayScreen({super.key});

  @override
  State<GatewayScreen> createState() => _GatewayScreenState();
}

class _GatewayScreenState extends State<GatewayScreen> with SingleTickerProviderStateMixin {
  bool _isStreaming = false;
  
  late AnimationController _pulseController;
  late Animation<double> _scaleAnimation;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _checkServiceStatus();
    
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    );

    _scaleAnimation = Tween<double>(begin: 1.0, end: 1.6).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeOut),
    );

    _fadeAnimation = Tween<double>(begin: 0.5, end: 0.0).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeOut),
    );
  }

  Future<void> _checkServiceStatus() async {
    final service = FlutterBackgroundService();
    bool isRunning = await service.isRunning();
    if (isRunning) {
      setState(() => _isStreaming = true);
      _pulseController.repeat();
    }
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  String _getNextDeletionDate() {
    DateTime now = DateTime.now();
    DateTime nextMonth = DateTime(now.year, now.month + 1, 1);
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June', 
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    String monthName = months[nextMonth.month - 1];
    return "1st $monthName, ${nextMonth.year}";
  }

  void _toggleStreaming() async {
    final service = FlutterBackgroundService();
    
    if (!_isStreaming) {
      bool isGranted = await NotificationListenerService.isPermissionGranted();
      if (!isGranted) {
        await NotificationListenerService.requestPermission();
        isGranted = await NotificationListenerService.isPermissionGranted();
        if (!isGranted) return; 
      }
      
      await service.startService();
      _pulseController.repeat();
      _showToast('App is now listening to UPI notifications.');
      
      setState(() => _isStreaming = true);
      
    } else {
      service.invoke("stopService");
      _pulseController.reset();
      _showToast('Service stopped.');
      
      setState(() => _isStreaming = false);
    }
  }

  void _showToast(String message) {
    ScaffoldMessenger.of(context).clearSnackBars();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          message,
          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w500),
          textAlign: TextAlign.center,
        ),
        backgroundColor: const Color(0xFF374151),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        margin: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
        duration: const Duration(seconds: 3),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.only(top: 40.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: const [
                  Text('notBruce', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w800, color: Color(0xFF6D28D9), letterSpacing: -0.5)),
                  SizedBox(width: 6),
                  Text('Clips', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w600, color: Color(0xFF6B7280))),
                ],
              ),
            ),
            
            Expanded(
              child: Center(
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    if (_isStreaming)
                      AnimatedBuilder(
                        animation: _pulseController,
                        builder: (context, child) {
                          return Transform.scale(
                            scale: _scaleAnimation.value,
                            child: Opacity(
                              opacity: _fadeAnimation.value,
                              child: Container(width: 220, height: 220, decoration: const BoxDecoration(shape: BoxShape.circle, color: Color(0xFF6D28D9))),
                            ),
                          );
                        },
                      ),
                    GestureDetector(
                      onTap: _toggleStreaming,
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 300),
                        width: 220, height: 220,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: _isStreaming ? const Color(0xFF6D28D9) : Colors.white,
                          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 15, offset: const Offset(0, 8))],
                          border: Border.all(color: _isStreaming ? Colors.transparent : const Color(0xFFE5E7EB), width: 2),
                        ),
                        child: Center(
                          child: Text(
                            _isStreaming ? 'Stop\nStreaming' : 'Start\nStreaming',
                            textAlign: TextAlign.center,
                            style: TextStyle(fontSize: 24, fontWeight: FontWeight.w700, color: _isStreaming ? Colors.white : const Color(0xFF4B5563)),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            
            Padding(
              padding: const EdgeInsets.only(bottom: 20.0),
              child: Column(
                children: [
                  TextButton.icon(
                    onPressed: () {
                      Navigator.push(
                        context, 
                        MaterialPageRoute(builder: (context) => const DatabaseViewScreen())
                      );
                    },
                    icon: const Icon(Icons.storage, color: Color(0xFF6D28D9)),
                    label: const Text(
                      'View Database', 
                      style: TextStyle(color: Color(0xFF6D28D9), fontWeight: FontWeight.bold)
                    ),
                    style: TextButton.styleFrom(
                      backgroundColor: const Color(0xFF6D28D9).withOpacity(0.1),
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Local database will auto-clear on ${_getNextDeletionDate()}',
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: Color(0xFF9CA3AF)),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class DatabaseViewScreen extends StatelessWidget {
  const DatabaseViewScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Local Transactions', style: TextStyle(color: Colors.black87, fontSize: 18)),
        backgroundColor: Colors.white,
        elevation: 1,
        iconTheme: const IconThemeData(color: Colors.black87),
      ),
      body: FutureBuilder<List<Map<String, dynamic>>>(
        future: DatabaseHelper.instance.getAllTransactions(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (!snapshot.hasData || snapshot.data!.isEmpty) {
            return const Center(
              child: Text('Database is completely empty.', style: TextStyle(color: Colors.grey)),
            );
          }

          final records = snapshot.data!;
          
          return ListView.builder(
            padding: const EdgeInsets.all(12),
            itemCount: records.length,
            itemBuilder: (context, index) {
              final tx = records[index];
              final bool isSent = tx['status'] == 'sent';
              
              final DateTime date = DateTime.parse(tx['time']).toLocal();
              final String timeString = "${date.day}/${date.month} ${date.hour}:${date.minute.toString().padLeft(2, '0')}";

              return Card(
                elevation: 0,
                color: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                  side: BorderSide(color: Colors.grey.shade200)
                ),
                child: ListTile(
                  title: Text(
                    tx['client_key'],
                    style: const TextStyle(fontSize: 13, fontFamily: 'monospace', fontWeight: FontWeight.bold),
                  ),
                  subtitle: Text('Captured: $timeString'),
                  trailing: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: isSent ? Colors.green.withOpacity(0.1) : Colors.orange.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      tx['status'].toString().toUpperCase(),
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        color: isSent ? Colors.green[700] : Colors.orange[800],
                      ),
                    ),
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}