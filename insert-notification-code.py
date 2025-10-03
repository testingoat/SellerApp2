#!/usr/bin/env python3
import re

print("🔧 Inserting notification persistence code...")

# Read the original file
with open('/var/www/goatgoat-staging/server/src/app.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Read the code to insert
with open('/tmp/notification-persistence-code.txt', 'r', encoding='utf-8') as f:
    insert_code = f.read()

# Find the specific line where we need to insert
# Looking for: "// Don't fail the whole operation if logging fails" followed by closing brace
# Then we insert before "reply.type('application/json');"

# Split content into lines for easier manipulation
lines = content.split('\n')

# Find the insertion point
insert_index = -1
for i, line in enumerate(lines):
    if "// Don't fail the whole operation if logging fails" in line:
        # Find the next closing brace after this comment
        for j in range(i+1, min(i+5, len(lines))):
            if lines[j].strip() == '}':
                insert_index = j + 1
                break
        break

if insert_index == -1:
    print("❌ Could not find insertion point")
    exit(1)

print(f"📍 Found insertion point at line {insert_index}")

# Insert the code
lines.insert(insert_index, insert_code)

# Join back
modified_content = '\n'.join(lines)

# Write back
with open('/var/www/goatgoat-staging/server/src/app.ts', 'w', encoding='utf-8') as f:
    f.write(modified_content)

print("✅ Code inserted successfully!")
print(f"📝 Inserted at line {insert_index}")

