#!/usr/bin/env python3
"""
Fix AdminJS redirect URL to use correct resource ID
Replace dynamic resource.id() with hardcoded 'seller-products'
"""

import re

print("🔧 Fixing AdminJS redirect URL...")

file_path = '/var/www/goatgoat-staging/server/src/config/setup.ts'

# Read the file
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Count occurrences before fix
before_count = content.count("redirectUrl: `/admin/resources/${resource.id()}/actions/list`")
print(f"📍 Found {before_count} occurrences of dynamic redirect URL")

# Replace with hardcoded resource ID
old_pattern = r"redirectUrl: `/admin/resources/\$\{resource\.id\(\)\}/actions/list`"
new_replacement = "redirectUrl: '/admin/resources/seller-products/actions/list'"

content = re.sub(old_pattern, new_replacement, content)

# Verify the replacement
after_count = content.count("redirectUrl: `/admin/resources/${resource.id()}/actions/list`")
new_count = content.count("redirectUrl: '/admin/resources/seller-products/actions/list'")

print(f"✅ Replaced {before_count - after_count} occurrences")
print(f"✅ New pattern appears {new_count} times")

# Write back
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ File updated successfully!")
print(f"📝 Redirect URL now points to: /admin/resources/seller-products/actions/list")

