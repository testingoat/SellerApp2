#!/usr/bin/env python3
"""
Fix product approval by removing problematic approvedBy field
and adding better error logging
"""

import re

print("🔧 Fixing product approval validation issue...")

file_path = '/var/www/goatgoat-staging/server/src/config/setup.ts'

# Read the file
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix 1: Remove approvedBy from approve action
# Find the approve action update block and remove approvedBy line
old_approve_pattern = r"await record\.update\(\{\s*status: 'approved',\s*approvedBy: currentAdmin\?\.id \|\| 'admin',\s*approvedAt: new Date\(\),\s*rejectionReason: null\s*\}\);"
new_approve_replacement = """await record.update({
                status: 'approved',
                approvedAt: new Date(),
                rejectionReason: null
            });"""

content = re.sub(old_approve_pattern, new_approve_replacement, content, flags=re.DOTALL)

# Fix 2: Add better error logging and validation check
# Add console.log after save to verify it worked
old_save_pattern = r"(await record\.save\(\);)\s*(return \{)"
new_save_replacement = r"\1\n            console.log('✅ Product approved and saved successfully');\n            \2"

content = re.sub(old_save_pattern, new_save_replacement, content)

# Fix 3: Add error details to catch block
old_error_pattern = r"console\.error\('\s*Error approving product:', error\);"
new_error_replacement = "console.error('❌ Error approving product:', error.message, error.stack);"

content = re.sub(old_error_pattern, new_error_replacement, content)

# Write back
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Fixed approve action:")
print("   - Removed problematic approvedBy field")
print("   - Added success logging after save")
print("   - Enhanced error logging")
print("\n📝 Changes:")
print("   1. Removed: approvedBy: currentAdmin?.id || 'admin'")
print("   2. Added: console.log after successful save")
print("   3. Enhanced: error logging with stack trace")

