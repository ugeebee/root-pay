import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:notification_listener_service/notification_listener_service.dart';
import 'package:notification_listener_service/notification_event.dart';
import 'package:http/http.dart' as http;

void main() {
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

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  bool _hasPermission = false;
  
  // IMPORTANT: Replace this with your computer's local IP address (e.g., 192.168.1.X) 
  // while testing locally, or your AWS EC2 IP when deployed.
  // Do NOT use "localhost" or "127.0.0.1" here because the Android emulator 
  // or physical phone considers itself "localhost".
  final String _goServerUrl = "http://192.168.1.8:8080/api/webhooks/upi"; 

  // The package names for the major Indian UPI apps
  final List<String> _targetPackages = [
    "com.google.android.apps.nbu.paisa.user", // Google Pay
    "com.phonepe.app",                        // PhonePe
    "net.one97.paytm"                         // Paytm
  ];

  @override
  void initState() {
    super.initState();
    _checkPermission();
  }

  Future<void> _checkPermission() async {
    bool isGranted = await NotificationListenerService.isPermissionGranted();
    setState(() {
      _hasPermission = isGranted;
    });

    if (isGranted) {
      _startListening();
    }
  }

  Future<void> _requestPermission() async {
    // This opens the Android settings screen for the streamer to toggle the switch
    await NotificationListenerService.requestPermission();
    _checkPermission();
  }

  void _startListening() {
    print("🎧 Root-Pay is now listening for UPI notifications...");
    
    // This Regex looks for exactly 32 consecutive numbers anywhere in the text
    final RegExp keyRegExp = RegExp(r'\b\d{32}\b');

    NotificationListenerService.notificationsStream.listen((ServiceNotificationEvent event) {
      // 1. Check if the notification is from a supported UPI app and has text
      if (_targetPackages.contains(event.packageName) && event.content != null) {
        
        // 2. Scan the notification text for our 32-digit client_key
        var match = keyRegExp.firstMatch(event.content!);

        if (match != null) {
          String extractedKey = match.group(0)!;
          print("🚨 MATCH FOUND! Extracted Key: $extractedKey");
          
          // 3. Fire it directly to the Go Webhook!
          _forwardToGoServer(extractedKey);
        } else {
          // It was a UPI notification, but just a standard one without our invoice key
          print("Ignored standard UPI notification (No 32-digit key found).");
        }
      }
    });
  }

  Future<void> _forwardToGoServer(String clientKey) async {
    try {
      final response = await http.post(
        Uri.parse(_goServerUrl),
        headers: {"Content-Type": "application/json"},
        // This matches our exact Go Webhook struct expecting client_key
        body: jsonEncode({
          "client_key": clientKey,
        }),
      );

      if (response.statusCode == 200) {
        print("🚀 Successfully unlocked SSE stream on Go Engine!");
      } else {
        print("⚠️ Go Engine rejected the key. Status: ${response.statusCode}");
      }
    } catch (e) {
      print("❌ Failed to reach Go server. Check your IP address: $e");
    }
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
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              _hasPermission ? Icons.check_circle : Icons.warning_amber_rounded,
              size: 80,
              color: _hasPermission ? Colors.green : Colors.orange,
            ),
            const SizedBox(height: 20),
            Text(
              _hasPermission 
                ? "Listening for UPI Payments..." 
                : "Notification Access Required",
              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 40),
            if (!_hasPermission)
              ElevatedButton.icon(
                onPressed: _requestPermission,
                icon: const Icon(Icons.settings),
                label: const Text("Grant Permission"),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                ),
              ),
          ],
        ),
      ),
    );
  }
}