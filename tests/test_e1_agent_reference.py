import hashlib
import json
import unittest
import zipfile
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
ARCHIVE = REPO / 'canonical' / 'v1.0' / 'source_archives' / 'EveGlyph_ASCS_v0.7_Agentic_Workspace_Round_Complete.zip'
PACKAGE_REF = REPO / 'packages' / 'ascs-agent' / 'reference' / 'v07'
COVERAGE = PACKAGE_REF / 'E1_VECTOR_COVERAGE.json'

V07_ARCHIVE_SHA256 = 'ac8b37e81ad343153f920df18a8b1976a8e091cf5d22fb827feed63c62c9604c'
EXPECTED_VECTOR_COUNT = 36
EXPECTED_E1_COVERED = 17
EXPECTED_DEFERRED = 19

COPIES = {
    'schemas/agent-principal.schema.json': 'schemas/agent-principal.schema.json',
    'schemas/agent-context-pack.schema.json': 'schemas/agent-context-pack.schema.json',
    'schemas/agent-run.schema.json': 'schemas/agent-run.schema.json',
    'schemas/agent-proposal.schema.json': 'schemas/agent-proposal.schema.json',
    'schemas/agent-review-policy.schema.json': 'schemas/agent-review-policy.schema.json',
    'examples/agent_principal_example.json': 'examples/agent_principal_example.json',
    'examples/context_pack_example.json': 'examples/context_pack_example.json',
    'examples/agent_run_example.json': 'examples/agent_run_example.json',
    'examples/patch_proposal_example.json': 'examples/patch_proposal_example.json',
    'examples/direct_proposal_example.json': 'examples/direct_proposal_example.json',
    'examples/review_policy_example.json': 'examples/review_policy_example.json',
    'conformance/agent_conformance_vectors.json': 'conformance/agent_conformance_vectors.json',
}


def archive_sha256():
    return hashlib.sha256(ARCHIVE.read_bytes()).hexdigest()


def support_prefix(names):
    matches = [name for name in names if name.endswith('/V0.7_Support/conformance/agent_conformance_vectors.json')]
    if len(matches) != 1:
        raise AssertionError(f'expected one V0.7_Support root, got {matches}')
    return matches[0].rsplit('/conformance/agent_conformance_vectors.json', 1)[0]


class E1AgentReferenceTests(unittest.TestCase):
    def test_frozen_v07_archive_hash_and_vector_set(self):
        self.assertEqual(archive_sha256(), V07_ARCHIVE_SHA256)
        with zipfile.ZipFile(ARCHIVE) as zf:
            prefix = support_prefix(zf.namelist())
            vectors = json.loads(zf.read(f'{prefix}/conformance/agent_conformance_vectors.json'))['vectors']
        ids = [item['id'] for item in vectors]
        self.assertEqual(len(ids), EXPECTED_VECTOR_COUNT)
        self.assertEqual(ids, [f'AG-{n:02d}' for n in range(1, 37)])
        self.assertEqual(len(set(ids)), EXPECTED_VECTOR_COUNT)

    def test_package_reference_copies_are_byte_identical_to_frozen_archive(self):
        with zipfile.ZipFile(ARCHIVE) as zf:
            prefix = support_prefix(zf.namelist())
            for archive_rel, package_rel in COPIES.items():
                local = PACKAGE_REF / package_rel
                self.assertTrue(local.is_file(), f'missing copied reference: {package_rel}')
                self.assertEqual(local.read_bytes(), zf.read(f'{prefix}/{archive_rel}'), package_rel)

    def test_e1_coverage_accounts_for_all_vectors_without_overclaim(self):
        self.assertTrue(COVERAGE.is_file(), 'E1 vector coverage manifest is missing')
        data = json.loads(COVERAGE.read_text(encoding='utf-8'))
        covered = data['covered']
        deferred = data['deferred']
        self.assertEqual(len(covered), EXPECTED_E1_COVERED)
        self.assertEqual(len(deferred), EXPECTED_DEFERRED)
        ids = covered + [row['id'] for row in deferred]
        self.assertEqual(sorted(ids), [f'AG-{n:02d}' for n in range(1, 37)])
        self.assertEqual(len(set(ids)), EXPECTED_VECTOR_COUNT)


if __name__ == '__main__':
    unittest.main()
