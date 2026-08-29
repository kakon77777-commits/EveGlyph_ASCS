import base64
import gzip
import json
import unittest
import zipfile
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
REF = REPO / 'packages' / 'ascs-agent' / 'reference' / 'v07'
BUNDLE = REF / 'REFERENCE_BUNDLE.json.gz'
ARCHIVE = REPO / 'canonical' / 'v1.0' / 'source_archives' / 'EveGlyph_ASCS_v0.7_Agentic_Workspace_Round_Complete.zip'
COPIES = [
    'schemas/agent-principal.schema.json',
    'schemas/agent-context-pack.schema.json',
    'schemas/agent-run.schema.json',
    'schemas/agent-proposal.schema.json',
    'schemas/agent-review-policy.schema.json',
    'examples/agent_principal_example.json',
    'examples/context_pack_example.json',
    'examples/agent_run_example.json',
    'examples/patch_proposal_example.json',
    'examples/direct_proposal_example.json',
    'examples/review_policy_example.json',
    'conformance/agent_conformance_vectors.json',
]


class E1ConformanceReferenceTests(unittest.TestCase):
    def test_physical_reference_copies_match_bundle_and_frozen_archive(self):
        bundle = json.loads(gzip.decompress(BUNDLE.read_bytes()).decode('utf-8'))
        with zipfile.ZipFile(ARCHIVE) as zf:
            names = zf.namelist()
            for rel in COPIES:
                physical_path = REF / rel
                self.assertTrue(physical_path.is_file(), rel)
                physical = physical_path.read_bytes()
                self.assertEqual(physical, base64.b64decode(bundle['files'][rel]), rel)
                matches = [name for name in names if name.endswith('/V0.7_Support/' + rel)]
                self.assertEqual(len(matches), 1, rel)
                self.assertEqual(physical, zf.read(matches[0]), rel)


if __name__ == '__main__':
    unittest.main()
