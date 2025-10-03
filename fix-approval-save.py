#!/usr/bin/env python3
"""
Fix AdminJS product approval to actually save changes
Add await record.save() after record.update()
"""

import re

print("🔧 Fixing AdminJS product approval save...")

file_path = '/var/www/goatgoat-staging/server/src/config/setup.ts'

# Read the file
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find and fix the approve action
modified = False
for i in range(len(lines)):
    # Look for the line with record.update in approve action
    if 'await record.update({' in lines[i] and i > 10:
        # Check if this is in the approve action (look back for 'Approving product')
        context = ''.join(lines[max(0, i-10):i])
        if 'Approving product' in context:
            # Find the closing of record.update (the line with });)
            for j in range(i+1, min(i+10, len(lines))):
                if '});' in lines[j] and 'rejectionReason' in ''.join(lines[i:j]):
                    # Add save() call after the update
                    indent = ' ' * 12  # Match indentation
                    lines[j] = lines[j].rstrip() + '\n' + indent + 'await record.save();\n'
                    print(f"✅ Added save() call after approve action update at line {j+1}")
                    modified = True
                    break
            break

# Find and fix the reject action
for i in range(len(lines)):
    # Look for the line with record.update in reject action
    if 'await record.update({' in lines[i] and i > 50:
        # Check if this is in the reject action (look back for 'Rejecting product')
        context = ''.join(lines[max(0, i-10):i])
        if 'Rejecting product' in context:
            # Find the closing of record.update (the line with });)
            for j in range(i+1, min(i+10, len(lines))):
                if '});' in lines[j] and 'rejectionReason' in ''.join(lines[i:j]):
                    # Add save() call after the update
                    indent = ' ' * 12  # Match indentation
                    lines[j] = lines[j].rstrip() + '\n' + indent + 'await record.save();\n'
                    print(f"✅ Added save() call after reject action update at line {j+1}")
                    modified = True
                    break
            break

if modified:
    # Write back
    with open(file_path, 'w', encoding='utf-8') as f:
        f.writelines(lines)
    print("✅ File updated successfully!")
    print("📝 Added await record.save() calls to persist changes to database")
else:
    print("⚠️ No changes made - pattern not found or already fixed")

