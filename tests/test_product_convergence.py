import json
import tempfile
import unittest
from pathlib import Path

from tools.product_convergence import (
    REQUIRED_CAPABILITIES,
    collect_parity,
    inventory_tree,
    load_baseline_manifest,
    payload_tree_sha256,
    verify_baseline,
)


REPO = Path(__file__).resolve().parents[1]


class ProductConvergenceTests(unittest.TestCase):
    def test_baseline_manifest_pins_current_and_historical_editor_commits(self):
        manifest = load_baseline_manifest(REPO)
        self.assertEqual(manifest["schema"], "eveglyph-ascs-upstream-baseline/1.0")
        self.assertEqual(manifest["upstream_repository"], "kakon77777-commits/eveglyph-editor")
        self.assertEqual(manifest["upstream_commit"], "c3258a2f461d5af5a69c879891b485ccf0f02635")
        self.assertEqual(manifest["handoff_historical_commit"], "55a2ad77f3131f717cf73992cc2550e4c3a864bb")
        self.assertEqual(manifest["authority"], "implementation-input-only")

    def test_vendored_baseline_matches_recorded_inventory(self):
        result = verify_baseline(REPO)
        self.assertTrue(result["ok"], result)
        self.assertEqual(result["missing"], [])
        self.assertEqual(result["unexpected"], [])
        self.assertEqual(result["mismatched"], [])
        self.assertGreater(result["files"], 0)
        self.assertGreater(result["bytes"], 0)

    def test_inventory_is_sorted_and_excludes_transient_directories(self):
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            (root / "src").mkdir()
            (root / "src" / "b.txt").write_text("b", encoding="utf-8")
            (root / "src" / "a.txt").write_text("a", encoding="utf-8")
            (root / "node_modules").mkdir()
            (root / "node_modules" / "ignored.js").write_text("x", encoding="utf-8")
            rows = inventory_tree(root)
            self.assertEqual([row["path"] for row in rows], ["src/a.txt", "src/b.txt"])

    def test_payload_tree_hash_is_deterministic(self):
        rows = [
            {"path": "b", "bytes": 2, "sha256": "2" * 64},
            {"path": "a", "bytes": 1, "sha256": "1" * 64},
        ]
        self.assertEqual(payload_tree_sha256(rows), payload_tree_sha256(list(reversed(rows))))

    def test_current_editor_required_parity_capabilities_are_present(self):
        parity = collect_parity(REPO)
        self.assertEqual(set(parity["required_capabilities"]), set(REQUIRED_CAPABILITIES))
        missing = [name for name in REQUIRED_CAPABILITIES if not parity["capabilities"][name]["present"]]
        self.assertEqual(missing, [], parity)

    def test_parity_report_is_machine_serializable(self):
        parity = collect_parity(REPO)
        encoded = json.dumps(parity, ensure_ascii=False, sort_keys=True)
        self.assertIn("typst_pdf_publication", encoded)
        self.assertIn("real_corpus_publication_tests", encoded)


if __name__ == "__main__":
    unittest.main()
