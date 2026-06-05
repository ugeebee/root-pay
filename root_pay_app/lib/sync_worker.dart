import 'package:workmanager/workmanager.dart';
import 'database_helper.dart';
import 'api_service.dart';

@pragma('vm:entry-point')
void callbackDispatcher() {
  Workmanager().executeTask((task, inputData) async {
    
    final dbHelper = DatabaseHelper.instance;

    // 1. Silent DB Cleanup (1st of the month logic)
    try {
      int deletedCount = await dbHelper.deleteOldTransactions();
      if (deletedCount > 0) {
        print("🧹 DB Cleanup: Purged $deletedCount old transactions.");
      }
    } catch (e) {
      print("Failed to run database cleanup: $e");
    }

    // 2. Fetch and process unsent queue
    final unsentList = await dbHelper.getUnsentTransactions();
    if (unsentList.isEmpty) return Future.value(true);

    for (var tx in unsentList) {
      int id = tx['id'];
      String clientKey = tx['client_key'];

      bool success = await ApiService.pushTransaction(clientKey);

      if (success) {
        await dbHelper.markAsSent(id);
        print("Background Sync Success: $clientKey");
      }
    }

    return Future.value(true);
  });
}