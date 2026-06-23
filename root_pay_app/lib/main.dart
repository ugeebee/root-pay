import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:notification_listener_service/notification_listener_service.dart';
import 'package:notification_listener_service/notification_event.dart';
import 'package:http/http.dart' as http;
import 'package:workmanager/workmanager.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'database_helper.dart';
import 'qr_scanner_screen.dart';

const String goServerWebhookUrl = "https://tip-root.in/api/webhooks/upi";

// IMPORTANT: WorkManager requires a top-level or static function.
@pragma('vm:entry-point')
void callbackDispatcher() {
  Workmanager().executeTask((task, inputData) async {
    print(
      "🔄 WorkManager triggered: Attempting to sync unacknowledged keys...",
    );

    final dbHelper = DatabaseHelper.instance;
    final unackedKeys = await dbHelper.getUnackedKeys();

    if (unackedKeys.isEmpty) {
      print("👍 No unacknowledged keys found. Background task complete.");
      return Future.value(true);
    }

    const storage = FlutterSecureStorage();
    String? token = await storage.read(key: 'webhook_token');

    if (token == null || token.isEmpty) {
      print("🛑 Background Sync Failed: No Auth Token available.");
      return Future.value(false); // Retry later
    }

    for (String key in unackedKeys) {
      try {
        final response = await http.post(
          Uri.parse(goServerWebhookUrl),
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer $token" // Secure Header
          },
          body: jsonEncode({"client_key": key}),
        );

        if (response.statusCode == 200) {
          await dbHelper.updateAck(key);
          print("🚀 Background Sync Success: $key");
        }
      } catch (e) {
        return Future.value(false); // Network error, backoff & retry
      }
    }
    return Future.value(true);
  });
}

void main() {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize WorkManager
  Workmanager().initialize(
    callbackDispatcher,
    isInDebugMode: true, // Set to false in production
  );

  runApp(const RootPayApp());
}

class RootPayApp extends StatelessWidget {
  const RootPayApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Root-Pay Trigger',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
        useMaterial3: true,
      ),
      home: const DashboardScreen(),
    );
  }
}

// ==========================================
// MAIN DASHBOARD SCREEN
// ==========================================
class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  bool _hasPermission = false;
  bool _hasToken = false;
  
  final secureStorage = const FlutterSecureStorage();
  final List<String> _targetPackages = [
    "com.google.android.apps.nbu.paisa.user",
    "com.phonepe.app",
    "net.one97.paytm",
    "com.whatsapp",
  ];

  @override
  void initState() {
    super.initState();
    _checkSetup();
  }

  Future<void> _checkSetup() async {
    String? token = await secureStorage.read(key: 'webhook_token');
    bool isGranted = await NotificationListenerService.isPermissionGranted();
    
    setState(() {
      _hasToken = (token != null && token.isNotEmpty);
      _hasPermission = isGranted;
    });

    if (isGranted && _hasToken) {
      _startListening();
    }
  }

  Future<void> _requestPermission() async {
    await NotificationListenerService.requestPermission();
    _checkSetup();
  }

  // --- THE QR SCANNER FLOW ---
  Future<void> _openScanner() async {
    final String? scannedToken = await Navigator.push(
      context,
      MaterialPageRoute(builder: (context) => const QrScannerScreen()),
    );

    if (scannedToken != null && scannedToken.isNotEmpty) {
      print("🎯 Scanned Token: $scannedToken");
      await secureStorage.write(key: 'webhook_token', value: scannedToken.trim());
      _checkSetup(); 
    }
  }

  // --- THE ROTATE TOKEN FLOW ---
  Future<void> _confirmRotateToken() async {
    return showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext dialogContext) {
        return AlertDialog(
          title: const Text('Rotate Token?'),
          content: const Text(
            'This will delete the existing token. You will have to scan the QR code again from your dashboard to reconnect.',
          ),
          actions: <Widget>[
            TextButton(
              child: const Text('Cancel'),
              onPressed: () => Navigator.of(dialogContext).pop(),
            ),
            TextButton(
              child: const Text('OK', style: TextStyle(color: Colors.red)),
              onPressed: () async {
                Navigator.of(dialogContext).pop(); 
                
                // Delete the token and reset UI
                await secureStorage.delete(key: 'webhook_token');
                _checkSetup(); 
              },
            ),
          ],
        );
      },
    );
  }

  void _startListening() {
    print("🎧 Root-Pay is now listening for UPI notifications...");
    final RegExp keyRegExp = RegExp(r'\b\d{32}\b');

    NotificationListenerService.notificationsStream.listen((event) async {
      if (_targetPackages.contains(event.packageName) && event.content != null) {
        var match = keyRegExp.firstMatch(event.content!);

        if (match != null) {
          String extractedKey = match.group(0)!;
          await DatabaseHelper.instance.insertKey(extractedKey);
          await _processKey(extractedKey);
        }
      }
    });
  }

  Future<void> _processKey(String clientKey) async {
    try {
      String? token = await secureStorage.read(key: 'webhook_token');
      if (token == null) return;

      final response = await http.post(
        Uri.parse(goServerWebhookUrl),
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer $token" // Sent Securely!
        },
        body: jsonEncode({"client_key": clientKey}),
      );

      if (response.statusCode == 200) {
        await DatabaseHelper.instance.updateAck(clientKey);
      } else {
        _triggerWorkManagerSync();
      }
    } catch (e) {
      _triggerWorkManagerSync();
    }
  }

  void _triggerWorkManagerSync() {
    Workmanager().registerOneOffTask(
      "sync_unacked_keys",
      "syncKeysTask",
      constraints: Constraints(networkType: NetworkType.connected),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Root-Pay Engine', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.deepPurple,
        foregroundColor: Colors.white,
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              
              // ==========================================
              // STATE 1: NO TOKEN
              // ==========================================
              if (!_hasToken) ...[
                const Icon(Icons.qr_code_scanner, size: 80, color: Colors.blue),
                const SizedBox(height: 20),
                const Text("Link your Device", style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
                const SizedBox(height: 10),
                const Text(
                  "Scan the QR code displayed on your dashboard to connect.",
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.grey),
                ),
                const SizedBox(height: 30),
                ElevatedButton.icon(
                  onPressed: _openScanner, // Opens the qr_scanner_screen.dart
                  icon: const Icon(Icons.camera_alt),
                  label: const Text("Scan QR Code"),
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                    textStyle: const TextStyle(fontSize: 18),
                  ),
                ),
              ],

              // ==========================================
              // STATE 2: TOKEN EXISTS, BUT NO PERMISSION
              // ==========================================
              if (_hasToken && !_hasPermission) ...[
                const Icon(Icons.warning_amber_rounded, size: 80, color: Colors.orange),
                const SizedBox(height: 20),
                const Text("Final Step!", style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
                const SizedBox(height: 10),
                const Text("We need permission to read the UPI notifications.", textAlign: TextAlign.center),
                const SizedBox(height: 20),
                ElevatedButton(
                  onPressed: _requestPermission,
                  child: const Text("Grant Permission"),
                ),
              ],

              // ==========================================
              // STATE 3: ALL GOOD (LISTENING)
              // ==========================================
              if (_hasToken && _hasPermission) ...[
                const Icon(Icons.check_circle, size: 100, color: Colors.green),
                const SizedBox(height: 20),
                const Text("Connected & Listening", style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
                const SizedBox(height: 10),
                const Text(
                  "Keep this app running in the background.",
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.grey),
                ),
                const SizedBox(height: 60),
                
                // The Rotate Token Button
                OutlinedButton.icon(
                  onPressed: _confirmRotateToken, // Triggers Alert Dialog
                  icon: const Icon(Icons.autorenew, color: Colors.red),
                  label: const Text("Rotate Token", style: TextStyle(color: Colors.red)),
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: Colors.red),
                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                  ),
                )
              ],
            ],
          ),
        ),
      ),
    );
  }
}