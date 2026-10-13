import 'dart:io';
import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as p;

// Accounts Table: Stored in integer paise (₹1 = 100 paise)
class Accounts extends Table {
  TextColumn get id => text()();
  TextColumn get name => text()();
  TextColumn get type => text()(); // cash, bank, savings, other
  IntColumn get openingBalancePaise => integer()();
  IntColumn get currentBalancePaise => integer()();
  TextColumn get description => text().nullable()();
  BoolColumn get isArchived => boolean().withDefault(const Constant(false))();
  DateTimeColumn get createdAt => dateTime()();

  @override
  Set<Column> get primaryKey => {id};
}

// Categories Table
class Categories extends Table {
  TextColumn get id => text()();
  TextColumn get name => text()();
  TextColumn get type => text()(); // income, expense
  TextColumn get icon => text()();
  TextColumn get color => text()();
  IntColumn get sortOrder => integer()();
  BoolColumn get isHidden => boolean().withDefault(const Constant(false))();
  BoolColumn get isDefault => boolean().withDefault(const Constant(false))();
  DateTimeColumn get createdAt => dateTime()();

  @override
  Set<Column> get primaryKey => {id};
}

// Transactions Table
class Transactions extends Table {
  TextColumn get id => text()();
  TextColumn get type => text()(); // expense, income, transfer, lend, repay_in, repay_out
  IntColumn get amountPaise => integer()(); // ₹ in Paise
  TextColumn get categoryId => text().nullable()();
  TextColumn get accountId => text()();
  TextColumn get toAccountId => text().nullable()();
  TextColumn get paymentMethod => text()();
  DateTimeColumn get transactionDate => dateTime()();
  TextColumn get timeString => text()(); // HH:mm
  TextColumn get note => text().nullable()();
  TextColumn get loanId => text().nullable()();
  DateTimeColumn get createdAt => dateTime()();
  DateTimeColumn get updatedAt => dateTime()();

  @override
  Set<Column> get primaryKey => {id};
}

// Budgets Table
class Budgets extends Table {
  TextColumn get id => text()();
  TextColumn get month => text()(); // YYYY-MM
  TextColumn get type => text()(); // overall, category
  TextColumn get categoryId => text().nullable()();
  IntColumn get limitPaise => integer()();
  DateTimeColumn get createdAt => dateTime()();

  @override
  Set<Column> get primaryKey => {id};
}

// Loans Table
class Loans extends Table {
  TextColumn get id => text()();
  TextColumn get type => text()(); // lent, borrowed
  TextColumn get personName => text()();
  IntColumn get principalPaise => integer()();
  IntColumn get repaidPaise => integer().withDefault(const Constant(0))();
  DateTimeColumn get date => dateTime()();
  DateTimeColumn get expectedDate => dateTime().nullable()();
  TextColumn get note => text().nullable()();
  TextColumn get accountId => text()();
  TextColumn get status => text()(); // pending, partially_repaid, fully_repaid
  DateTimeColumn get createdAt => dateTime()();
  DateTimeColumn get updatedAt => dateTime()();

  @override
  Set<Column> get primaryKey => {id};
}
