"""Check preserved course files against the audited source snapshot."""
import hashlib
import json
from pathlib import Path
import zipfile

root = Path(__file__).resolve().parents[1]
manifest = json.loads((root / 'docs/course-files.sha256.json').read_text())
errors = []
with zipfile.ZipFile(root / 'public/downloads/course-files.zip') as archive:
    expected = {'OMDSMod4Homework/' + path for path in manifest}
    if set(archive.namelist()) != expected:
        errors.append('ZIP inventory differs from the 34-file source inventory')
    for path, expected_hash in manifest.items():
        for label, read in [
            ('download', lambda p=path: (root / 'public/downloads' / p).read_bytes()),
            ('ZIP', lambda p=path: archive.read('OMDSMod4Homework/' + p)),
        ]:
            try:
                actual = hashlib.sha256(read()).hexdigest()
                if actual != expected_hash:
                    errors.append(f'{label}: checksum mismatch for {path}')
            except (OSError, KeyError) as error:
                errors.append(f'{label}: {path}: {error}')
if errors:
    raise SystemExit('\n'.join(errors))
print(f'PASS: all {len(manifest)} original course files and ZIP copies match the audited source.')
