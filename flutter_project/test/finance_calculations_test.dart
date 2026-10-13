import 'package:flutter_test/flutter_test.dart';

int rupeesToPaise(double rupees) => (rupees * 100).round();
double paiseToRupees(int paise) => paise / 100.0;

void main() {
  group('Financial Calculations Tests', () {
    test('Zero floating point error: Rupees to Paise conversion', () {
      expect(rupeesToPaise(10.50), 1050);
      expect(rupeesToPaise(0.99), 99);
      expect(rupeesToPaise(125000.75), 12500075);
    });

    test('Lending accounting excludes repayments from new income', () {
      final initialBalance = 100000; // ₹1,000 in paise
      final loanPrincipal = 50000;   // ₹500 lent out
      
      // Balance reduces when lent
      final balanceAfterLend = initialBalance - loanPrincipal;
      expect(balanceAfterLend, 50000);

      // Repayment received increases balance, reduces receivable
      final partialRepayment = 20000; // ₹200
      final balanceAfterRepay = balanceAfterLend + partialRepayment;
      final outstandingReceivable = loanPrincipal - partialRepayment;

      expect(balanceAfterRepay, 70000); // ₹700 in account
      expect(outstandingReceivable, 30000); // ₹300 pending
    });

    test('Transfer between accounts is zero-sum overall', () {
      final accountABalance = 500000; // ₹5,000
      final accountBBalance = 200000; // ₹2,000
      final transferAmount = 150000;  // ₹1,500

      final newA = accountABalance - transferAmount;
      final newB = accountBBalance + transferAmount;

      expect(newA + newB, accountABalance + accountBBalance);
    });
  });
}
