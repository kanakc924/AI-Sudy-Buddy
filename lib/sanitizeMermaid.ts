/**
 * Sanitizes AI-generated Mermaid diagram code to fix common issues
 * before passing to the Mermaid renderer.
 */
export function sanitizeMermaid(raw: string): string {
  if (!raw || typeof raw !== 'string') {
    return 'flowchart TD\n    A["No diagram available"]'
  }

  let code = raw.trim()

  // Strip markdown code fences if AI wrapped it in them
  code = code.replace(/^```mermaid\s*/i, '').replace(/```\s*$/, '').trim()
  code = code.replace(/^```\s*/i, '').replace(/```\s*$/, '').trim()

  // Ensure it starts with a valid mermaid keyword
  if (!code.startsWith('flowchart') && !code.startsWith('graph')) {
    code = 'flowchart TD\n' + code
  }

  // Fix unquoted node labels that contain special characters
  // This regex finds [ ] node labels and wraps their content in double quotes
  // if they contain parentheses, commas, colons, slashes, or apostrophes
  code = code.replace(
    /\[([^\]"]*[(),:/&'<>][^\]"]*)\]/g,
    (match, label) => {
      // Already quoted — skip
      if (label.startsWith('"') && label.endsWith('"')) return match
      return `["${label.trim()}"]`
    }
  )

  // Fix labeled arrows that have unquoted text: -- text --> becomes -- "text" -->
  code = code.replace(/--([^>-][^-]*?)-->/g, (match, label) => {
    const trimmed = label.trim()
    if (trimmed.startsWith('"') && trimmed.endsWith('"')) return match
    return `-- "${trimmed}" -->`
  })

  // Remove any lines that are not valid mermaid syntax
  // (lines that are just plain sentences with no --> or node definitions)
  const lines = code.split('\n')
  const validLines = lines.filter(line => {
    const trimmed = line.trim()
    if (trimmed === '') return true
    if (trimmed.startsWith('flowchart') || trimmed.startsWith('graph')) return true
    if (trimmed.includes('-->') || trimmed.includes('---')) return true
    if (trimmed.match(/^\s*[A-Za-z0-9_]+[\[({"]/)) return true
    if (trimmed.startsWith('%%')) return true // comments
    return false
  })

  return validLines.join('\n').trim()
}
