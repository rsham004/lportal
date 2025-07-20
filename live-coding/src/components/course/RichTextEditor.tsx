/**
 * Rich Text Editor Component
 * 
 * Advanced WYSIWYG editor with markdown support, multimedia embedding,
 * and learning-focused features for creating educational content.
 */

'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'

// Phase 1 UI Components
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'

// ============================================================================
// INTERFACES
// ============================================================================

export interface RichTextEditorProps {
  content: string
  format: 'markdown' | 'html' | 'plain'
  onChange: (content: string, format: 'markdown' | 'html' | 'plain') => void
  placeholder?: string
  readOnly?: boolean
  showToolbar?: boolean
  showFormatToggle?: boolean
  maxLength?: number
  className?: string
}

interface EditorState {
  content: string
  format: 'markdown' | 'html' | 'plain'
  isPreview: boolean
  selection: { start: number; end: number } | null
  wordCount: number
  characterCount: number
}

interface ToolbarAction {
  name: string
  icon: string
  title: string
  action: () => void
  isActive?: boolean
  separator?: boolean
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function RichTextEditor({
  content,
  format,
  onChange,
  placeholder = 'Start writing...',
  readOnly = false,
  showToolbar = true,
  showFormatToggle = true,
  maxLength,
  className = ''
}: RichTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [editorState, setEditorState] = useState<EditorState>({
    content,
    format,
    isPreview: false,
    selection: null,
    wordCount: 0,
    characterCount: 0
  })

  const [showLinkDialog, setShowLinkDialog] = useState(false)
  const [showImageDialog, setShowImageDialog] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkText, setLinkText] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [imageAlt, setImageAlt] = useState('')

  // Update editor state when props change
  useEffect(() => {
    setEditorState(prev => ({
      ...prev,
      content,
      format,
      wordCount: countWords(content),
      characterCount: content.length
    }))
  }, [content, format])

  // Update selection when textarea focus changes
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    const handleSelectionChange = () => {
      setEditorState(prev => ({
        ...prev,
        selection: {
          start: textarea.selectionStart,
          end: textarea.selectionEnd
        }
      }))
    }

    textarea.addEventListener('select', handleSelectionChange)
    textarea.addEventListener('click', handleSelectionChange)
    textarea.addEventListener('keyup', handleSelectionChange)

    return () => {
      textarea.removeEventListener('select', handleSelectionChange)
      textarea.removeEventListener('click', handleSelectionChange)
      textarea.removeEventListener('keyup', handleSelectionChange)
    }
  }, [])

  const countWords = (text: string): number => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length
  }

  const updateContent = (newContent: string) => {
    const wordCount = countWords(newContent)
    const characterCount = newContent.length

    setEditorState(prev => ({
      ...prev,
      content: newContent,
      wordCount,
      characterCount
    }))

    onChange(newContent, editorState.format)
  }

  const insertText = (text: string, selectText = false) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const currentContent = editorState.content

    const newContent = 
      currentContent.substring(0, start) + 
      text + 
      currentContent.substring(end)

    updateContent(newContent)

    // Set cursor position after insertion
    setTimeout(() => {
      if (selectText) {
        textarea.setSelectionRange(start, start + text.length)
      } else {
        textarea.setSelectionRange(start + text.length, start + text.length)
      }
      textarea.focus()
    }, 0)
  }

  const wrapSelection = (before: string, after: string = before) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = editorState.content.substring(start, end)
    const currentContent = editorState.content

    const newContent = 
      currentContent.substring(0, start) + 
      before + selectedText + after + 
      currentContent.substring(end)

    updateContent(newContent)

    // Set cursor position after wrapping
    setTimeout(() => {
      if (selectedText) {
        textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length)
      } else {
        textarea.setSelectionRange(start + before.length, start + before.length)
      }
      textarea.focus()
    }, 0)
  }

  const toggleFormat = (newFormat: 'markdown' | 'html' | 'plain') => {
    setEditorState(prev => ({ ...prev, format: newFormat }))
    onChange(editorState.content, newFormat)
  }

  const togglePreview = () => {
    setEditorState(prev => ({ ...prev, isPreview: !prev.isPreview }))
  }

  // Toolbar actions
  const toolbarActions: ToolbarAction[] = [
    {
      name: 'bold',
      icon: '𝐁',
      title: 'Bold (Ctrl+B)',
      action: () => wrapSelection('**'),
      isActive: false
    },
    {
      name: 'italic',
      icon: '𝐼',
      title: 'Italic (Ctrl+I)',
      action: () => wrapSelection('*'),
      isActive: false
    },
    {
      name: 'underline',
      icon: '𝐔',
      title: 'Underline',
      action: () => wrapSelection('<u>', '</u>'),
      isActive: false
    },
    {
      name: 'separator1',
      icon: '',
      title: '',
      action: () => {},
      separator: true
    },
    {
      name: 'heading1',
      icon: 'H1',
      title: 'Heading 1',
      action: () => insertText('# ', false),
      isActive: false
    },
    {
      name: 'heading2',
      icon: 'H2',
      title: 'Heading 2',
      action: () => insertText('## ', false),
      isActive: false
    },
    {
      name: 'heading3',
      icon: 'H3',
      title: 'Heading 3',
      action: () => insertText('### ', false),
      isActive: false
    },
    {
      name: 'separator2',
      icon: '',
      title: '',
      action: () => {},
      separator: true
    },
    {
      name: 'list',
      icon: '•',
      title: 'Bullet List',
      action: () => insertText('- ', false),
      isActive: false
    },
    {
      name: 'numbered-list',
      icon: '1.',
      title: 'Numbered List',
      action: () => insertText('1. ', false),
      isActive: false
    },
    {
      name: 'quote',
      icon: '"',
      title: 'Quote',
      action: () => insertText('> ', false),
      isActive: false
    },
    {
      name: 'separator3',
      icon: '',
      title: '',
      action: () => {},
      separator: true
    },
    {
      name: 'link',
      icon: '🔗',
      title: 'Insert Link',
      action: () => setShowLinkDialog(true),
      isActive: false
    },
    {
      name: 'image',
      icon: '🖼️',
      title: 'Insert Image',
      action: () => setShowImageDialog(true),
      isActive: false
    },
    {
      name: 'code',
      icon: '</>',
      title: 'Code Block',
      action: () => wrapSelection('```\n', '\n```'),
      isActive: false
    },
    {
      name: 'separator4',
      icon: '',
      title: '',
      action: () => {},
      separator: true
    },
    {
      name: 'table',
      icon: '⊞',
      title: 'Insert Table',
      action: () => insertTable(),
      isActive: false
    }
  ]

  const insertTable = () => {
    const tableMarkdown = `
| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Row 1    | Data     | Data     |
| Row 2    | Data     | Data     |
`
    insertText(tableMarkdown, false)
  }

  const insertLink = () => {
    if (!linkUrl) return

    const linkMarkdown = `[${linkText || linkUrl}](${linkUrl})`
    insertText(linkMarkdown, false)
    
    setShowLinkDialog(false)
    setLinkUrl('')
    setLinkText('')
  }

  const insertImage = () => {
    if (!imageUrl) return

    const imageMarkdown = `![${imageAlt}](${imageUrl})`
    insertText(imageMarkdown, false)
    
    setShowImageDialog(false)
    setImageUrl('')
    setImageAlt('')
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // In a real implementation, you would upload the file to your storage service
    // and get back a URL to insert into the editor
    console.log('File selected for upload:', file.name)
    
    // For now, just show the image dialog
    setShowImageDialog(true)
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.ctrlKey || event.metaKey) {
      switch (event.key) {
        case 'b':
          event.preventDefault()
          wrapSelection('**')
          break
        case 'i':
          event.preventDefault()
          wrapSelection('*')
          break
        case 'k':
          event.preventDefault()
          setShowLinkDialog(true)
          break
      }
    }

    // Tab handling for lists
    if (event.key === 'Tab') {
      const textarea = textareaRef.current
      if (!textarea) return

      const start = textarea.selectionStart
      const lineStart = editorState.content.lastIndexOf('\n', start - 1) + 1
      const lineText = editorState.content.substring(lineStart, start)

      if (lineText.match(/^(\s*)([-*+]|\d+\.)\s/)) {
        event.preventDefault()
        const indent = event.shiftKey ? '  ' : '    '
        if (event.shiftKey) {
          // Remove indent
          if (lineText.startsWith('  ')) {
            const newContent = 
              editorState.content.substring(0, lineStart) +
              lineText.substring(2) +
              editorState.content.substring(start)
            updateContent(newContent)
            setTimeout(() => {
              textarea.setSelectionRange(start - 2, start - 2)
            }, 0)
          }
        } else {
          // Add indent
          const newContent = 
            editorState.content.substring(0, lineStart) +
            indent + lineText +
            editorState.content.substring(start)
          updateContent(newContent)
          setTimeout(() => {
            textarea.setSelectionRange(start + indent.length, start + indent.length)
          }, 0)
        }
      }
    }
  }

  const renderPreview = () => {
    if (editorState.format === 'markdown') {
      // In a real implementation, you would use a markdown parser like 'marked' or 'remark'
      return (
        <div className="prose max-w-none p-4 min-h-64 bg-white border rounded">
          <div className="text-gray-500 text-sm mb-4">Markdown Preview</div>
          <pre className="whitespace-pre-wrap font-sans">{editorState.content}</pre>
        </div>
      )
    }

    if (editorState.format === 'html') {
      return (
        <div 
          className="prose max-w-none p-4 min-h-64 bg-white border rounded"
          dangerouslySetInnerHTML={{ __html: editorState.content }}
        />
      )
    }

    return (
      <div className="p-4 min-h-64 bg-white border rounded">
        <div className="text-gray-500 text-sm mb-4">Plain Text Preview</div>
        <pre className="whitespace-pre-wrap">{editorState.content}</pre>
      </div>
    )
  }

  return (
    <div className={`rich-text-editor ${className}`}>
      {/* Toolbar */}
      {showToolbar && !readOnly && (
        <div className="border border-b-0 rounded-t bg-gray-50 p-2">
          <div className="flex items-center gap-1 flex-wrap">
            {/* Format Toggle */}
            {showFormatToggle && (
              <>
                <Select
                  options={[
                    { value: 'markdown', label: 'Markdown' },
                    { value: 'html', label: 'HTML' },
                    { value: 'plain', label: 'Plain Text' }
                  ]}
                  value={editorState.format}
                  onChange={(value) => toggleFormat(value as any)}
                  className="w-32"
                />
                <div className="w-px h-6 bg-gray-300 mx-2" />
              </>
            )}

            {/* Toolbar Actions */}
            {toolbarActions.map((action, index) => (
              action.separator ? (
                <div key={index} className="w-px h-6 bg-gray-300 mx-1" />
              ) : (
                <Button
                  key={action.name}
                  variant="ghost"
                  size="sm"
                  onClick={action.action}
                  title={action.title}
                  className={`px-2 py-1 text-sm ${action.isActive ? 'bg-blue-100' : ''}`}
                >
                  {action.icon}
                </Button>
              )
            ))}

            <div className="w-px h-6 bg-gray-300 mx-2" />

            {/* Preview Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={togglePreview}
              className={`px-3 py-1 text-sm ${editorState.isPreview ? 'bg-blue-100' : ''}`}
            >
              {editorState.isPreview ? 'Edit' : 'Preview'}
            </Button>

            {/* File Upload */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              title="Upload Image"
              className="px-2 py-1 text-sm"
            >
              📎
            </Button>
          </div>
        </div>
      )}

      {/* Editor/Preview Area */}
      <div className="relative">
        {editorState.isPreview ? (
          renderPreview()
        ) : (
          <textarea
            ref={textareaRef}
            value={editorState.content}
            onChange={(e) => updateContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            readOnly={readOnly}
            maxLength={maxLength}
            className={`w-full min-h-64 p-4 border ${showToolbar ? 'rounded-b' : 'rounded'} resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace' }}
          />
        )}

        {/* Character/Word Count */}
        {!readOnly && (
          <div className="absolute bottom-2 right-2 text-xs text-gray-500 bg-white px-2 py-1 rounded shadow">
            {editorState.wordCount} words • {editorState.characterCount} characters
            {maxLength && ` • ${maxLength - editorState.characterCount} remaining`}
          </div>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Link Dialog */}
      {showLinkDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 w-96">
            <h3 className="font-semibold mb-4">Insert Link</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">URL</label>
                <Input
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Link Text (optional)</label>
                <Input
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="Link text"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowLinkDialog(false)}
                >
                  Cancel
                </Button>
                <Button onClick={insertLink} disabled={!linkUrl}>
                  Insert Link
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Image Dialog */}
      {showImageDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 w-96">
            <h3 className="font-semibold mb-4">Insert Image</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Image URL</label>
                <Input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Alt Text</label>
                <Input
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  placeholder="Describe the image"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowImageDialog(false)}
                >
                  Cancel
                </Button>
                <Button onClick={insertImage} disabled={!imageUrl}>
                  Insert Image
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

export default RichTextEditor