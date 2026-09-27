import unittest

from engine import investigate, run_evaluations


class InvestigationEngineTests(unittest.TestCase):
    def test_recurring_payment_is_explained(self) -> None:
        result = investigate("tx-spotify")
        self.assertEqual(result["outcome"], "recognized_pattern")
        self.assertGreater(result["confidence"], 0.9)

    def test_unknown_merchant_is_not_guessed(self) -> None:
        result = investigate("tx-hotel")
        self.assertEqual(result["outcome"], "insufficient_evidence")
        self.assertEqual(result["nextAction"], "ask_user")
        merchant_evidence = next(item for item in result["evidence"] if item["label"] == "Merchant identity")
        self.assertEqual(merchant_evidence["value"], "Unverified")

    def test_reverted_authorisation_avoids_false_dispute(self) -> None:
        result = investigate("tx-duplicate")
        self.assertEqual(result["outcome"], "reverted_duplicate")
        self.assertEqual(result["nextAction"], "recognize")

    def test_built_in_evaluations_pass(self) -> None:
        self.assertTrue(all(item["passed"] for item in run_evaluations()))


if __name__ == "__main__":
    unittest.main()
