import unittest
from pathlib import Path

from tools.security_upstream import (
    SECURITY_UPSTREAM_COMMIT,
    SECURITY_UPSTREAM_REPOSITORY,
    SECURITY_UPSTREAM_TREE,
    load_security_manifest,
    validate_security_manifest,
)

REPO = Path(__file__).resolve().parents[1]


class SecurityUpstreamTests(unittest.TestCase):
    def test_manifest_pins_reviewed_security_upstream_without_authority(self):
        manifest = load_security_manifest(REPO)
        self.assertEqual(manifest["schema"], "eveglyph-ascs-security-upstream/1.0")
        self.assertEqual(manifest["repository"], SECURITY_UPSTREAM_REPOSITORY)
        self.assertEqual(manifest["commit"], SECURITY_UPSTREAM_COMMIT)
        self.assertEqual(manifest["git_tree"], SECURITY_UPSTREAM_TREE)
        self.assertEqual(manifest["authority"], "implementation-reference-only")
        self.assertEqual(
            manifest["merge_parents"],
            [
                "5405255f0eb527ca3ae848477b1be328f9f69153",
                "2ac9dfdeaabc629ef0564eaf78a84f4b5226561b",
            ],
        )

    def test_manifest_is_structurally_valid_and_has_unique_safe_paths(self):
        manifest = load_security_manifest(REPO)
        self.assertEqual(validate_security_manifest(manifest), [])
        paths = [row["path"] for row in manifest["files"]]
        self.assertEqual(paths, sorted(set(paths)))
        self.assertTrue(all(not path.startswith("/") and ".." not in Path(path).parts for path in paths))

    def test_manifest_pins_all_required_security_component_classes(self):
        manifest = load_security_manifest(REPO)
        roles = {row["role"] for row in manifest["files"]}
        self.assertTrue({
            "capability-control-plane",
            "credential-custody",
            "delegation",
            "connector",
            "ingress",
            "physical-sandbox",
            "security-verifier",
        }.issubset(roles))

    def test_reviewed_fix_evidence_is_explicit(self):
        manifest = load_security_manifest(REPO)
        fix_ids = {row["id"] for row in manifest["reviewed_fixes"]}
        self.assertEqual(fix_ids, {
            "windows-named-pipe-framing",
            "sandbox-entrypoint-bypass",
            "prototype-chain-capability-lookup",
            "wildcard-segment-boundary",
            "google-export-bounded-stream",
            "delegation-sensitive-result-filter",
            "delegated-credential-id-redaction",
        })


if __name__ == "__main__":
    unittest.main()
