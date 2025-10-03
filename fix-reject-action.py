#!/usr/bin/env python3
"""
Fix reject action by removing problematic approvedBy field
"""

import re

print("🔧 Fixing reject action validation issue...")

file_path = '/var/www/goatgoat-staging/server/src/config/setup.ts'

# Read the file
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix reject action: Remove approvedBy and approvedAt (not needed for rejection)
old_reject_pattern = r"await record\.update\(\{\s*status: 'rejected',\s*approvedBy: currentAdmin\?\.id \|\| 'admin',\s*approvedAt: new Date\(\),\s*rejectionReason: rejectionReason\s*\}\);"
new_reject_replacement = """await record.update({
                status: 'rejected',
                rejectionReason: rejectionReason
            });"""

content = re.sub(old_reject_pattern, new_reject_replacement, content, flags=re.DOTALL)

# Fix the console.log message for reject action (it says "approved" but should say "rejected")
content = content.replace(
    "console.log('✅ Product approved and saved successfully');",
    "console.log('✅ Product rejected and saved successfully');",
    1  # Only replace the first occurrence (in reject action)
)

# Write back
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Fixed reject action:")
print("   - Removed problematic approvedBy field")
print("   - Removed approvedAt (not needed for rejection)")
print("   - Fixed console.log message")
print("\n📝 Changes:")
print("   1. Removed: approvedBy: currentAdmin?.id || 'admin'")
print("   2. Removed: approvedAt: new Date()")
print("   3. Fixed: console.log message to say 'rejected' not 'approved'")

