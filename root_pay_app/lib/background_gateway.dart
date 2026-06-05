import 'dart:async';
import 'dart:ui';
import 'package:flutter_background_service/flutter_background_service.dart';
import 'package:notification_listener_service/notification_listener_service.dart';

import 'database_helper.dart';
import 'api_service.dart';

@pragma('vm:entry-point')
void onStart(ServiceInstance service) async {
  DartPluginRegistrant.ensureInitialized();

  service.on('stopService').listen((event) {
    service.stopSelf();
  });

  print("Headless Isolate Started Listening...");

  NotificationListenerService.notificationsStream.listen((event) async {
    if (event.packageName == 'com.google.android.apps.nbu.paisa.user' || 
        event.packageName == 'com.google.android.apps.walletnfcrel') {
      
      String rawText = "${event.title} ${event.content}";
      RegExp regExp = RegExp(r'\b[a-zA-Z0-9]{32}\b');
      var match = regExp.firstMatch(rawText);

      if (match != null) {
        String clientKey = match.group(0)!;
        print("✅ Extracted Client Key: $clientKey");

        final dbHelper = DatabaseHelper.instance;
        int txId = await dbHelper.insertTransaction(clientKey);

        bool success = await ApiService.pushTransaction(clientKey);

        if (success) {
          await dbHelper.markAsSent(txId);
          print("Immediate push successful!");
        } else {
          print("Immediate push failed, WorkManager will retry later.");
        }
      }
    }
  });
}