#!/usr/bin/env python3
"""
Fix AdminJS href() function error
Replace resource.href({ resourceId: resource.id() }) with proper redirect URL
"""

import re

print("🔧 Fixing AdminJS href() error...")

file_path = '/var/www/goatgoat-staging/server/src/config/setup.ts'

# Read the file
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Count occurrences before fix
before_count = content.count('resource.href({ resourceId: resource.id() })')
print(f"📍 Found {before_count} occurrences of resource.href()")

# Replace resource.href({ resourceId: resource.id() }) with the correct approach
# In AdminJS, we should redirect to the resource list page
old_pattern = r'redirectUrl: resource\.href\(\{ resourceId: resource\.id\(\) \}\)'
new_replacement = "redirectUrl: `/admin/resources/${resource.id()}/actions/list`"

content = re.sub(old_pattern, new_replacement, content)

# Verify the replacement
after_count = content.count('resource.href({ resourceId: resource.id() })')
new_count = content.count("redirectUrl: `/admin/resources/${resource.id()}/actions/list`")

print(f"✅ Replaced {before_count - after_count} occurrences")
print(f"✅ New pattern appears {new_count} times")

# Write back
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ File updated successfully!")
print(f"📝 Fixed lines: 35 and 77")

