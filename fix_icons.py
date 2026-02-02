import re

f = 'src/components/Dashboard.tsx'
with open(f) as fh:
    code = fh.read()

# 1. Replace emoji references with icon references
code = code.replace('{CATEGORIES[cat].emoji} ', '{CATEGORY_ICONS[cat]} ')
code = code.replace('{CATEGORIES[entry.category]?.emoji}', '{CATEGORY_ICONS[entry.category]}')

# 2. Replace fire emoji
code = code.replace(
    '<span className="text-3xl">🔥</span>',
    '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500"><path d="M12 12c-2-2.67-4-4.33-4-6 0-3.31 3-4 4-4s4 .69 4 4c0 1.67-2 3.33-4 6z"/><path d="M12 22c-4.97 0-9-2.69-9-6 0-4 4.03-6.5 9-12 4.97 5.5 9 8 9 12 0 3.31-4.03 6-9 6z"/></svg>'
)

# 3. Replace empty box emoji
code = code.replace(
    '<div className="text-4xl mb-2">📦</div>',
    '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-foreground-secondary mx-auto mb-2"><path d="M12 2L3 7v10l9 5 9-5V7l-9-5z"/><path d="M12 22V12"/><path d="M3 7l9 5 9-5"/></svg>'
)

with open(f, 'w') as fh:
    fh.write(code)

print('Done')
