import base64
import gzip
import json
import unittest
import zipfile
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
REF = REPO / 'packages' / 'ascs-agent' / 'reference' / 'v07'
PHYSICAL = REF / 'conformance' / 'agent_conformance_vectors.json'
BUNDLE = REF / 'REFERENCE_BUNDLE.json.gz'
ARCHIVE = REPO / 'canonical' / 'v1.0' / 'source_archives' / 'EveGlyph_ASCS_v0.7_Agentic_Workspace_Round_Complete.zip'
REL = 'conformance/agent_conformance_vectors.json'


class E1ConformanceReferenceTests(unittest.TestCase):
    def test_physical_vector_copy_matches_bundle_and_frozen_archive(self):
        self.assertTrue(PHYSICAL.is_file())
        physical = PHYSICAL.read_bytes()
        bundle = json.loads(gzip.decompress(BUNDLE.read_bytes()).decode('utf-8'))
        self.assertEqual(physical, base64.b64decode(bundle['files'][REL]))
        with zipfile.ZipFile(ARCHIVE) as zf:
            matches = [name for name in zf.namelist() if name.endswith('/V0.7_Support/' + REL)]
            self.assertEqual(len(matches), 1)
            self.assertEqual(physical, zf.read(matches[0]))


if __name__ == '__main__':
    unittest.main()
