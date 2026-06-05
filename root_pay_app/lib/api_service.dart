import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiService {
  static const String webhookUrl = 'https://root.ugbhartariya.com/api/webhooks/upi';

  static Future<bool> pushTransaction(String clientKey) async {
    try {
      final response = await http.post(
        Uri.parse(webhookUrl),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'client_key': clientKey}),
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        return true;
      } else {
        print("Backend returned status: ${response.statusCode}");
        return false;
      }
    } catch (e) {
      print("Network push failed: $e");
      return false;
    }
  }
}