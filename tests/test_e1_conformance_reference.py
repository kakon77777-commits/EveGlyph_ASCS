import base64
import gzip
import json
import subprocess
import unittest
import zipfile
from pathlib import Path, PurePosixPath

REPO = Path(__file__).resolve().parents[1]
REF = REPO / 'packages' / 'ascs-agent' / 'reference' / 'v07'
REF_GIT_PREFIX = PurePosixPath('packages/ascs-agent/reference/v07')
BUNDLE = REF / 'REFERENCE_BUNDLE.json.gz'
ARCHIVE = REPO / 'canonical' / 'v1.0' / 'source_archives' / 'EveGlyph_ASCS_v0.7_Agentic_Workspace_Round_Complete.zip'


def _git_blob_bytes(repo: Path, git_relative_path: str) -> bytes:
    # Reads content from Git's object store (`git show HEAD:<path>`) instead
    # of the checked-out working-tree file. On a Windows checkout with
    # core.autocrlf=true, git rewrites LF to CRLF for text files on checkout,
    # so Path.read_bytes() here would not byte-match the LF content frozen in
    # REFERENCE_BUNDLE.json.gz / the source archive ZIP (both binary
    # containers that are never subject to checkout-time text conversion) —
    # confirmed empirically: schemas/agent-principal.schema.json mismatched
    # by exactly its own \r\n vs \n line-ending difference. Git's object
    # store always has the canonical bytes regardless of local checkout
    # configuration, matching the fix already applied to
    # tools/security_upstream.py during the E0 review.
    return subprocess.run(
        ['git', '-C', str(repo), 'show', f'HEAD:{git_relative_path}'],
        check=True, stdout=subprocess.PIPE,
    ).stdout


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
                physical = _git_blob_bytes(REPO, str(REF_GIT_PREFIX / rel))
                self.assertEqual(physical, base64.b64decode(bundle['files'][rel]), rel)
                matches = [name for name in names if name.endswith('/V0.7_Support/' + rel)]
                self.assertEqual(len(matches), 1, rel)
                self.assertEqual(physical, zf.read(matches[0]), rel)


if __name__ == '__main__':
    unittest.main()
