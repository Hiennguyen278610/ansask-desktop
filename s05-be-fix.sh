#!/bin/bash
set -e

# 1. Xoá hàm get_exam_batch_id không dùng trong trash_repo.rs
python3 - << 'PYEOF'
p = 'src-tauri/src/repositories/trash_repo.rs'
s = open(p).read()
start = s.find('pub fn get_exam_batch_id(')
if start != -1:
    end = s.find('}\n\n', start) + 3
    s = s[:start] + s[end:]
open(p, 'w').write(s)
PYEOF

# 2. Xoá .into() thừa trong trash_service.rs
sed -i 's/AppError::DuplicateName(name.into())/AppError::DuplicateName(name)/g' src-tauri/src/services/trash_service.rs
sed -i 's/AppError::DuplicateName(title.into())/AppError::DuplicateName(title)/g' src-tauri/src/services/trash_service.rs

cd src-tauri && cargo fmt && cd ..
