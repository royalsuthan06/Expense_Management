import 'dart:io';
import 'package:intl/intl.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import 'package:file_picker/file_picker.dart';

class BackupService {
  static Future<String> createDatabaseBackup() async {
    final appDir = await getApplicationDocumentsDirectory();
    final dbFile = File(p.join(appDir.path, 'dhantrack.sqlite'));

    if (!await dbFile.exists()) {
      throw Exception('Database file does not exist');
    }

    final dateStr = DateFormat('yyyy-MM-dd').format(DateTime.now());
    final backupFileName = 'personal_finance_backup_$dateStr.db';
    final tempDir = await getTemporaryDirectory();
    final backupFile = File(p.join(tempDir.path, backupFileName));

    await dbFile.copy(backupFile.path);

    await Share.shareXFiles(
      [XFile(backupFile.path)],
      text: 'DhanTrack SQLite Database Backup ($dateStr)',
      subject: 'DhanTrack Backup',
    );

    return backupFile.path;
  }

  static Future<bool> restoreDatabaseFromPicker() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['db', 'sqlite'],
    );

    if (result == null || result.files.single.path == null) {
      return false;
    }

    final pickedFile = File(result.files.single.path!);
    final appDir = await getApplicationDocumentsDirectory();
    final targetDbFile = File(p.join(appDir.path, 'dhantrack.sqlite'));

    if (await targetDbFile.exists()) {
      final safetyBackup = File(p.join(appDir.path, 'dhantrack_safety_copy.sqlite'));
      await targetDbFile.copy(safetyBackup.path);
    }

    await pickedFile.copy(targetDbFile.path);
    return true;
  }
}
