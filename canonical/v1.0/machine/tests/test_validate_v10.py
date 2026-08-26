from __future__ import annotations
import copy, json, tempfile, unittest
from pathlib import Path
import sys
TOOLS=Path(__file__).resolve().parents[1]/"tools"
sys.path.insert(0,str(TOOLS))
from validate_v10 import validate_manifest_data, validate_archive_entry

ROOT=Path(__file__).resolve().parents[2]
MANIFEST=json.loads((ROOT/"machine/canonical_handoff_manifest_v1.0.json").read_text("utf-8"))

class V10ValidatorTests(unittest.TestCase):
    def test_valid_manifest_semantics_pass(self):
        self.assertEqual([], validate_manifest_data(copy.deepcopy(MANIFEST), ROOT, verify_archives=False, verify_docs=False))
    def test_canonicalization_change_under_same_contract_is_rejected(self):
        m=copy.deepcopy(MANIFEST); m["canonicalization"]="egir-cj/0.2"
        self.assertTrue(any("canonicalization" in e for e in validate_manifest_data(m, ROOT, verify_archives=False, verify_docs=False)))
    def test_candidate_profile_cannot_be_silently_promoted(self):
        m=copy.deepcopy(MANIFEST)
        for p in m["profiles"]:
            if p["profile_id"]=="ncm/1.0-candidate.1": p["profile_id"]="ncm/1.0"
        self.assertTrue(any("ncm/1.0-candidate.1" in e for e in validate_manifest_data(m, ROOT, verify_archives=False, verify_docs=False)))
    def test_archive_hash_mismatch_is_rejected(self):
        entry=copy.deepcopy(MANIFEST["source_archives"][0])
        with tempfile.TemporaryDirectory() as td:
            p=Path(td)/entry["filename"]; p.write_bytes(b"not the archive")
            self.assertTrue(any("sha256" in e.lower() or "zip" in e.lower() for e in validate_archive_entry(entry, Path(td))))
    def test_missing_required_handoff_document_is_rejected(self):
        with tempfile.TemporaryDirectory() as td:
            tmp=Path(td)
            self.assertTrue(any("required handoff document" in e for e in validate_manifest_data(copy.deepcopy(MANIFEST), tmp, verify_archives=False, verify_docs=True)))
    def test_v09_to_v10_mandatory_migration_is_rejected(self):
        m=copy.deepcopy(MANIFEST); m["mandatory_canonical_migration_from_ascs_0_9"]=True
        self.assertTrue(any("mandatory canonical migration" in e for e in validate_manifest_data(m, ROOT, verify_archives=False, verify_docs=False)))

if __name__=="__main__": unittest.main(verbosity=2)
