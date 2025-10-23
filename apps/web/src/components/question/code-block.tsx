'use client'

import { Light as SyntaxHighlighter } from 'react-syntax-highlighter'
import python from 'react-syntax-highlighter/dist/esm/languages/hljs/python'
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs'

// Register Python language
SyntaxHighlighter.registerLanguage('python', python)

interface CodeBlockProps {
  code: string
  language?: string
}

export function CodeBlock({ code, language = 'python' }: CodeBlockProps) {
  return (
    <div className="my-4 rounded-lg overflow-hidden border border-border">
      <SyntaxHighlighter
        language={language}
        style={atomOneDark}
        customStyle={{
          margin: 0,
          padding: '1rem',
          fontSize: '0.875rem',
          background: 'transparent',
        }}
        showLineNumbers
      >
        {code}
      </SyntaxHighlighter>
    </div>
  )
}

