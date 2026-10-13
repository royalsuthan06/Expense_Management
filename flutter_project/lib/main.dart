import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
      systemNavigationBarColor: Color(0xFF0B0F19),
      systemNavigationBarIconBrightness: Brightness.light,
    ),
  );
  runApp(const ProviderScope(child: DhanTrackApp()));
}

class DhanTrackApp extends StatelessWidget {
  const DhanTrackApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'DhanTrack',
      debugShowCheckedModeBanner: false,
      themeMode: ThemeMode.dark,
      darkTheme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF0B0F19),
        cardColor: const Color(0xFF161F30),
        primaryColor: const Color(0xFF0D9488),
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF14B8A6),
          secondary: Color(0xFF06B6D4),
          surface: Color(0xFF111827),
          background: Color(0xFF0B0F19),
          error: Color(0xFFF43F5E),
        ),
        fontFamily: 'PlusJakartaSans',
        useMaterial3: true,
      ),
      home: const MainNavigationScreen(),
    );
  }
}

class MainNavigationScreen extends StatefulWidget {
  const MainNavigationScreen({super.key});

  @override
  State<MainNavigationScreen> createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends State<MainNavigationScreen> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('DhanTrack — Personal Finance', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        backgroundColor: const Color(0xFF0F172A),
      ),
      body: Center(
        child: Text('DhanTrack Destination Index: \$_currentIndex'),
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        backgroundColor: const Color(0xFF0F172A),
        indicatorColor: const Color(0xFF14B8A6).withOpacity(0.2),
        onDestinationSelected: (idx) => setState(() => _currentIndex = idx),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.dashboard_outlined), label: 'Home'),
          NavigationDestination(icon: Icon(Icons.receipt_long_outlined), label: 'Records'),
          NavigationDestination(icon: Icon(Icons.pie_chart_outline), label: 'Budget'),
          NavigationDestination(icon: Icon(Icons.handshake_outlined), label: 'Lending'),
          NavigationDestination(icon: Icon(Icons.menu), label: 'More'),
        ],
      ),
    );
  }
}
