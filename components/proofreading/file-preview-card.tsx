"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { FileText, List, Download } from "lucide-react"
import type { ParsedFile, Chapter } from "@/lib/file-parser"
import { useState, useEffect, useRef, useMemo } from "react"
import { exportByBlob } from "@/lib/utils"
import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface FilePreviewCardProps {
  open: boolean
  file: ParsedFile | null
  onConfirm: (text: string) => void
  onTransfer: (text: string) => Promise<void>
}

export function FilePreviewCard({ open, file, onConfirm, onTransfer }: FilePreviewCardProps) {
  const previewRef = useRef<HTMLDivElement>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [isPlainText, setIsPlainText] = useState(false)
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null)
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null)

  const selectedChapterContent = useMemo(() => {
    return (isPlainText ? previewRef.current?.innerText : selectedChapter?.content) || ''
  }, [isPlainText, selectedChapter])

  useEffect(() => {
    if (file) {
      const fileChapters = file.chapters?.length ? file.chapters : [{
        id: "chapter-full",
        title: "全文",
        content: file.text,
      }]

      setChapters(fileChapters)

      if (fileChapters.length > 0) {
        setSelectedChapter(fileChapters[0])
        setActiveChapterId(fileChapters[0].id)
      }
    } else {
      setChapters([])
      setSelectedChapter(null)
      setActiveChapterId(null)
    }
  }, [file])

  const exportText = () => {
    const blob = new Blob([selectedChapterContent], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const fileName = `${file?.metadata.fileName.trim()}.md`

    exportByBlob(url, fileName)
  }

  if (!file || !open) return null

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" /> 文件预览
          </div>
          <span onClick={exportText} className="text-xs text-primary flex items-center gap-1 cursor-pointer">
            <Download className="h-3 w-3" /> 导出文本
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Two-column layout for chapters and content */}
          <div className="flex gap-4 h-[500px]">
            {/* Left column - Chapter navigation */}
            <div className="w-1/4 flex flex-col border rounded-md">
              <div className="p-3 border-b bg-muted/30 flex items-center gap-2">
                <List className="h-4 w-4" />
                <span className="font-medium">章节目录</span>
              </div>
              <ScrollArea className="flex-1 p-2">
                <div className="space-y-0.5">
                  {chapters.map((chapter) => (
                    <Button
                      key={chapter.id}
                      variant={activeChapterId === chapter.id ? "secondary" : "ghost"}
                      className="w-full justify-start h-auto py-1.5 px-2 text-left"
                      onClick={() => {
                        setSelectedChapter(chapter)
                        setActiveChapterId(chapter.id)
                      }}
                    >
                      <span
                        className="truncate text-sm"
                        style={{ paddingLeft: chapter.level ? (chapter.level - 1) * 12 : 0 }}
                      >
                        {chapter.title}
                      </span>
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Right column - Chapter content */}
            <div className="w-3/4 flex flex-col border rounded-md">
              <div className="flex items-center justify-between p-3 border-b bg-muted/30">
                <h3 className="font-medium line-clamp-2">{selectedChapter?.title || "选择一个章节"}</h3>
                <span className="text-xs text-muted-foreground">{selectedChapter?.content.length} 字符</span>
              </div>
              <ScrollArea className="flex-1 p-4">
                <div ref={previewRef} className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed">
                  {selectedChapter?.content ? (
                    <Markdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({ children }) => <h1 className="text-xl font-bold mt-4 mb-2">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-lg font-bold mt-3 mb-2">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-base font-semibold mt-3 mb-1">{children}</h3>,
                        h4: ({ children }) => <h4 className="text-sm font-semibold mt-2 mb-1">{children}</h4>,
                        h5: ({ children }) => <h5 className="text-sm font-medium mt-2 mb-1">{children}</h5>,
                        h6: ({ children }) => <h6 className="text-sm font-medium mt-2 mb-1">{children}</h6>,
                        p: ({ children }) => <p className="mb-2 whitespace-pre-wrap">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc pl-5 mb-2">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal pl-5 mb-2">{children}</ol>,
                        li: ({ children }) => <li className="mb-0.5">{children}</li>,
                        blockquote: ({ children }) => (
                          <blockquote className="border-l-4 border-muted-foreground/30 pl-3 italic my-2">{children}</blockquote>
                        ),
                        code: ({ children, className }) => {
                          const isInline = !className
                          return isInline
                            ? <code className="bg-muted px-1 py-0.5 rounded text-xs">{children}</code>
                            : <code className={className}>{children}</code>
                        },
                        pre: ({ children }) => (
                          <pre className="bg-muted p-3 rounded-md overflow-x-auto mb-2 text-xs">{children}</pre>
                        ),
                        table: ({ children }) => (
                          <div className="overflow-x-auto mb-2">
                            <table className="border-collapse border border-border text-sm">{children}</table>
                          </div>
                        ),
                        th: ({ children }) => (
                          <th className="border border-border px-2 py-1 bg-muted font-medium text-left">{children}</th>
                        ),
                        td: ({ children }) => (
                          <td className="border border-border px-2 py-1">{children}</td>
                        ),
                        a: ({ href, children }) => (
                          <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline">{children}</a>
                        ),
                        hr: () => <hr className="my-4 border-border" />,
                      }}
                    >
                      {selectedChapter.content}
                    </Markdown>
                  ) : (
                    <p className="text-muted-foreground">请选择左侧的章节进行预览</p>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="useProxy"
                checked={isPlainText}
                onCheckedChange={() => setIsPlainText(!isPlainText)}
              />
              <Label htmlFor="useProxy" className="cursor-pointer text-sm">纯文本</Label>
            </div>

            <Button
              onClick={() => {
                onConfirm(selectedChapterContent)
              }}
            >
              选择当前
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
