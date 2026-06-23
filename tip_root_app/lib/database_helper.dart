import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';

class DatabaseHelper {
  static final DatabaseHelper instance = DatabaseHelper._init();
  static Database? _database;

  DatabaseHelper._init();

  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDB('payment_keys.db');
    return _database!;
  }

  Future<Database> _initDB(String filePath) async {
    final dbPath = await getDatabasesPath();
    final path = join(dbPath, filePath);

    return await openDatabase(
      path,
      version: 1,
      onCreate: (db, version) async {
        await db.execute('''
          CREATE TABLE keys (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            client_key TEXT NOT NULL UNIQUE,
            ack INTEGER NOT NULL DEFAULT 0
          )
        ''');
      },
    );
  }

  // Insert key with ack = false (0)
  Future<void> insertKey(String clientKey) async {
    final db = await instance.database;
    try {
      await db.insert(
        'keys',
        {'client_key': clientKey, 'ack': 0},
        conflictAlgorithm: ConflictAlgorithm.ignore, // Prevent duplicates
      );
      print("💾 Saved to SQLite: $clientKey (ack: false)");
    } catch (e) {
      print("Error inserting key: $e");
    }
  }

  // Update ack to true (1)
  Future<void> updateAck(String clientKey) async {
    final db = await instance.database;
    await db.update(
      'keys',
      {'ack': 1},
      where: 'client_key = ?',
      whereArgs: [clientKey],
    );
    print("✅ SQLite Updated: $clientKey (ack: true)");
  }

  // Fetch all keys where ack = false (0)
  Future<List<String>> getUnackedKeys() async {
    final db = await instance.database;
    final maps = await db.query(
      'keys',
      columns: ['client_key'],
      where: 'ack = ?',
      whereArgs: [0],
    );
    return maps.map((map) => map['client_key'] as String).toList();
  }
}
