import hashlib
import tempfile
import unittest
import zipfile
from pathlib import Path

from tools.ascs_repo import (
    UnsafeArchiveError,
    build_inventory,
    safe_extract_single_wrapper,
    sha256_path,
    source_inventory_matches,
)


class AscsRepoTests(unittest.TestCase):
    def test_rejects_parent_traversal(self):
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            archive = root / "bad.zip"
            with zipfile.ZipFile(archive, "w") as z:
                z.writestr("wrapper/../../escape.txt", b"escape")

            with self.assertRaises(UnsafeArchiveError):
                safe_extract_single_wrapper(archive, root / "out", "wrapper")

    def test_rejects_absolute_and_drive_paths(self):
        for member in ("/absolute.txt", "C:/drive.txt", r"C:\drive.txt"):
            with self.subTest(member=member), tempfile.TemporaryDirectory() as td:
                root = Path(td)
                archive = root / "bad.zip"
                with zipfile.ZipFile(archive, "w") as z:
                    z.writestr(member, b"escape")

                with self.assertRaises(UnsafeArchiveError):
                    safe_extract_single_wrapper(archive, root / "out", "wrapper")

    def test_strips_one_wrapper_and_preserves_bytes(self):
        payload = "繁體中文 ASCS\n".encode("utf-8")
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            archive = root / "good.zip"
            with zipfile.ZipFile(archive, "w") as z:
                z.writestr("wrapper/machine/vector.json", payload)

            out = root / "out"
            records = safe_extract_single_wrapper(archive, out, "wrapper")

            self.assertEqual((out / "machine/vector.json").read_bytes(), payload)
            self.assertFalse((out / "wrapper").exists())
            self.assertEqual(records[0]["sha256"], hashlib.sha256(payload).hexdigest())

    def test_refuses_existing_destination_file(self):
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            archive = root / "good.zip"
            with zipfile.ZipFile(archive, "w") as z:
                z.writestr("wrapper/file.txt", b"archive")

            out = root / "out"
            out.mkdir()
            (out / "file.txt").write_bytes(b"existing")

            with self.assertRaises(FileExistsError):
                safe_extract_single_wrapper(archive, out, "wrapper")

    def test_inventory_is_sorted_and_hashes_bytes(self):
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            markdown_names = ["b.md", "a.md", *[f"document-{i}.md" for i in range(6)]]
            archive_names = [f"archive-{i:02d}.zip" for i in range(12)]
            for name in markdown_names:
                (root / name).write_bytes(name.encode("utf-8"))
            for name in archive_names:
                (root / name).write_bytes(name.encode("utf-8"))

            inventory = build_inventory(root)
            paths = [record["relative_path"] for record in inventory]
            a_record = next(record for record in inventory if record["relative_path"] == "a.md")

            self.assertEqual(paths, sorted(markdown_names + archive_names))
            self.assertEqual(a_record["sha256"], hashlib.sha256(b"a.md").hexdigest())
            self.assertEqual(sha256_path(root / "a.md"), a_record["sha256"])

    def test_source_inventory_ignores_repository_only_metadata(self):
        live = [
            {
                "relative_path": "paper.md",
                "kind": "document",
                "role": "loose-source-document",
                "bytes": 5,
                "sha256": hashlib.sha256(b"paper").hexdigest(),
            }
        ]
        recorded = [
            {
                **live[0],
                "provenance_path": "provenance/source-directory/documents/paper.md",
            }
        ]

        self.assertTrue(source_inventory_matches(live, recorded))


if __name__ == "__main__":
    unittest.main()
