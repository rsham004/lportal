'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Switch } from '@/components/ui/Switch'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { useAuth } from '@/components/auth/AuthProvider'
import { QuizQuestion, QuestionType, QuizOption, QuizSettings } from '@/lib/types/course'
import { createQuizQuestion, updateQuizQuestion, deleteQuizQuestion } from '@/lib/services/courseService'
import { 
  PlusIcon, 
  TrashIcon, 
  PencilIcon, 
  GripVerticalIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

interface Quiz {
  id?: string
  title: string
  description?: string
  questions: QuizQuestion[]
  timeLimit?: number
  passingScore: number
  shuffleQuestions?: boolean
  showResultsImmediately?: boolean
  allowRetakes?: boolean
  settings?: QuizSettings
}

interface QuizBuilderProps {
  onSave: (quiz: Quiz) => void
  onCancel: () => void
  lessonId: string
  initialQuiz?: Quiz
}

interface QuestionFormData {
  type: QuestionType
  question: string
  explanation?: string
  points: number
  options: QuizOption[]
  correctAnswer?: string
  pairs?: { left: string; right: string }[]
  blanks?: string[]
}

const QUESTION_TYPES: { value: QuestionType; label: string; description: string }[] = [
  { value: 'multiple_choice', label: 'Multiple Choice', description: 'Choose one correct answer from multiple options' },
  { value: 'true_false', label: 'True/False', description: 'Simple true or false question' },
  { value: 'short_answer', label: 'Short Answer', description: 'Brief text response' },
  { value: 'essay', label: 'Essay', description: 'Long-form written response' },
  { value: 'fill_blank', label: 'Fill in the Blank', description: 'Complete the sentence with missing words' },
  { value: 'matching', label: 'Matching', description: 'Match items from two columns' },
]

export function QuizBuilder({ onSave, onCancel, lessonId, initialQuiz }: QuizBuilderProps) {
  const { user } = useAuth()
  const [quiz, setQuiz] = useState<Quiz>({
    title: '',
    description: '',
    questions: [],
    passingScore: 70,
    shuffleQuestions: false,
    showResultsImmediately: true,
    allowRetakes: true,
    ...initialQuiz,
  })

  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null)
  const [questionForm, setQuestionForm] = useState<QuestionFormData>({
    type: 'multiple_choice',
    question: '',
    points: 1,
    options: [
      { id: '1', text: 'Option 1', is_correct: false },
      { id: '2', text: 'Option 2', is_correct: false },
    ],
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  useEffect(() => {
    setHasUnsavedChanges(true)
  }, [quiz])

  const validateQuiz = useCallback((): Record<string, string> => {
    const newErrors: Record<string, string> = {}

    if (!quiz.title.trim()) {
      newErrors.title = 'Quiz title is required'
    }

    if (quiz.questions.length === 0) {
      newErrors.questions = 'At least one question is required'
    }

    return newErrors
  }, [quiz])

  const validateQuestion = useCallback((form: QuestionFormData): Record<string, string> => {
    const newErrors: Record<string, string> = {}

    if (!form.question.trim()) {
      newErrors.question = 'Question text is required'
    }

    if (form.type === 'multiple_choice') {
      if (form.options.length < 2) {
        newErrors.options = 'At least 2 options are required'
      }
      if (!form.options.some(opt => opt.is_correct)) {
        newErrors.correctAnswer = 'Please select the correct answer'
      }
    }

    if (form.type === 'true_false') {
      if (!form.correctAnswer) {
        newErrors.correctAnswer = 'Please select the correct answer'
      }
    }

    if (form.type === 'short_answer' && !form.correctAnswer?.trim()) {
      newErrors.correctAnswer = 'Correct answer is required'
    }

    if (form.type === 'matching' && (!form.pairs || form.pairs.length < 2)) {
      newErrors.pairs = 'At least 2 matching pairs are required'
    }

    if (form.type === 'fill_blank' && (!form.blanks || form.blanks.length === 0)) {
      newErrors.blanks = 'At least one blank answer is required'
    }

    return newErrors
  }, [])

  const handleAddQuestion = () => {
    setEditingQuestion(null)
    setQuestionForm({
      type: 'multiple_choice',
      question: '',
      points: 1,
      options: [
        { id: '1', text: 'Option 1', is_correct: false },
        { id: '2', text: 'Option 2', is_correct: false },
      ],
    })
    setErrors({})
    setIsQuestionModalOpen(true)
  }

  const handleEditQuestion = (question: QuizQuestion) => {
    setEditingQuestion(question)
    setQuestionForm({
      type: question.type,
      question: question.question,
      explanation: question.explanation,
      points: question.points,
      options: question.options || [],
      correctAnswer: question.type === 'true_false' ? (question.options?.[0]?.is_correct ? 'true' : 'false') : undefined,
      pairs: question.pairs,
      blanks: question.blanks,
    })
    setErrors({})
    setIsQuestionModalOpen(true)
  }

  const handleDeleteQuestion = async (questionId: string) => {
    try {
      if (quiz.id) {
        await deleteQuizQuestion(questionId)
      }
      setQuiz(prev => ({
        ...prev,
        questions: prev.questions.filter(q => q.id !== questionId)
      }))
    } catch (error) {
      console.error('Failed to delete question:', error)
    }
  }

  const handleSaveQuestion = async () => {
    const validationErrors = validateQuestion(questionForm)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    const questionData: QuizQuestion = {
      id: editingQuestion?.id || `temp-${Date.now()}`,
      type: questionForm.type,
      question: questionForm.question.trim(),
      explanation: questionForm.explanation?.trim(),
      points: questionForm.points,
      required: true,
      options: questionForm.type === 'multiple_choice' ? questionForm.options : 
               questionForm.type === 'true_false' ? [
                 { id: 'true', text: 'True', is_correct: questionForm.correctAnswer === 'true' },
                 { id: 'false', text: 'False', is_correct: questionForm.correctAnswer === 'false' }
               ] : undefined,
      pairs: questionForm.pairs,
      blanks: questionForm.blanks,
    }

    try {
      if (editingQuestion && quiz.id) {
        await updateQuizQuestion(questionData)
      } else if (quiz.id) {
        await createQuizQuestion({ ...questionData, quiz_id: quiz.id })
      }

      setQuiz(prev => ({
        ...prev,
        questions: editingQuestion 
          ? prev.questions.map(q => q.id === editingQuestion.id ? questionData : q)
          : [...prev.questions, questionData]
      }))

      setIsQuestionModalOpen(false)
      setErrors({})
    } catch (error) {
      console.error('Failed to save question:', error)
      setErrors({ submit: 'Failed to save question. Please try again.' })
    }
  }

  const handleQuestionReorder = (result: any) => {
    if (!result.destination) return

    const items = Array.from(quiz.questions)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setQuiz(prev => ({ ...prev, questions: items }))
  }

  const handleSaveQuiz = () => {
    const validationErrors = validateQuiz()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    // Sanitize quiz data
    const sanitizedQuiz = {
      ...quiz,
      title: quiz.title.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ''),
      description: quiz.description?.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ''),
    }

    onSave(sanitizedQuiz)
    setHasUnsavedChanges(false)
  }

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      setShowCancelConfirm(true)
    } else {
      onCancel()
    }
  }

  const confirmCancel = () => {
    setShowCancelConfirm(false)
    onCancel()
  }

  const addOption = () => {
    const newOption: QuizOption = {
      id: `${questionForm.options.length + 1}`,
      text: `Option ${questionForm.options.length + 1}`,
      is_correct: false,
    }
    setQuestionForm(prev => ({
      ...prev,
      options: [...prev.options, newOption]
    }))
  }

  const removeOption = (index: number) => {
    if (questionForm.options.length <= 2) return
    setQuestionForm(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }))
  }

  const updateOption = (index: number, field: keyof QuizOption, value: any) => {
    setQuestionForm(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => 
        i === index ? { ...opt, [field]: value } : opt
      )
    }))
  }

  const setCorrectOption = (index: number) => {
    setQuestionForm(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => ({
        ...opt,
        is_correct: i === index
      }))
    }))
  }

  const addMatchingPair = () => {
    setQuestionForm(prev => ({
      ...prev,
      pairs: [...(prev.pairs || []), { left: '', right: '' }]
    }))
  }

  const updateMatchingPair = (index: number, side: 'left' | 'right', value: string) => {
    setQuestionForm(prev => ({
      ...prev,
      pairs: prev.pairs?.map((pair, i) => 
        i === index ? { ...pair, [side]: value } : pair
      )
    }))
  }

  const removeMatchingPair = (index: number) => {
    setQuestionForm(prev => ({
      ...prev,
      pairs: prev.pairs?.filter((_, i) => i !== index)
    }))
  }

  const renderQuestionForm = () => {
    switch (questionForm.type) {
      case 'multiple_choice':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Options</label>
              {questionForm.options.map((option, index) => (
                <div key={option.id} className="flex items-center gap-2 mb-2">
                  <input
                    type="radio"
                    name="correct-answer"
                    checked={option.is_correct}
                    onChange={() => setCorrectOption(index)}
                    className="radio"
                  />
                  <Input
                    value={option.text}
                    onChange={(e) => updateOption(index, 'text', e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className="flex-1"
                  />
                  {questionForm.options.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeOption(index)}
                      aria-label="Remove option"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addOption}
                className="mt-2"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Add Option
              </Button>
              {errors.options && <p className="text-red-500 text-sm mt-1">{errors.options}</p>}
              {errors.correctAnswer && <p className="text-red-500 text-sm mt-1">{errors.correctAnswer}</p>}
            </div>
          </div>
        )

      case 'true_false':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Correct Answer</label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="true-false"
                    value="true"
                    checked={questionForm.correctAnswer === 'true'}
                    onChange={(e) => setQuestionForm(prev => ({ ...prev, correctAnswer: e.target.value }))}
                    className="radio mr-2"
                  />
                  True
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="true-false"
                    value="false"
                    checked={questionForm.correctAnswer === 'false'}
                    onChange={(e) => setQuestionForm(prev => ({ ...prev, correctAnswer: e.target.value }))}
                    className="radio mr-2"
                  />
                  False
                </label>
              </div>
              {errors.correctAnswer && <p className="text-red-500 text-sm mt-1">{errors.correctAnswer}</p>}
            </div>
          </div>
        )

      case 'short_answer':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Correct Answer</label>
              <Input
                value={questionForm.correctAnswer || ''}
                onChange={(e) => setQuestionForm(prev => ({ ...prev, correctAnswer: e.target.value }))}
                placeholder="Enter the correct answer"
              />
              {errors.correctAnswer && <p className="text-red-500 text-sm mt-1">{errors.correctAnswer}</p>}
            </div>
          </div>
        )

      case 'essay':
        return (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                <ExclamationTriangleIcon className="h-4 w-4 inline mr-1" />
                Manual grading required
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Essay questions require manual review and grading by instructors.
              </p>
            </div>
          </div>
        )

      case 'fill_blank':
        return (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700 mb-2">
                Use [blank] to indicate where answers should go
              </p>
              <p className="text-xs text-gray-600">
                Example: "The capital of France is [blank] and it has [blank] million people."
              </p>
            </div>
            <Textarea
              value={questionForm.question}
              onChange={(e) => setQuestionForm(prev => ({ ...prev, question: e.target.value }))}
              placeholder="Enter question with [blank] placeholders"
              rows={3}
            />
            <div>
              <label className="block text-sm font-medium mb-2">Correct Answers (in order)</label>
              {(questionForm.blanks || []).map((blank, index) => (
                <div key={index} className="flex items-center gap-2 mb-2">
                  <span className="text-sm text-gray-500 w-16">Blank {index + 1}:</span>
                  <Input
                    value={blank}
                    onChange={(e) => {
                      const newBlanks = [...(questionForm.blanks || [])]
                      newBlanks[index] = e.target.value
                      setQuestionForm(prev => ({ ...prev, blanks: newBlanks }))
                    }}
                    placeholder="Correct answer"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const newBlanks = questionForm.blanks?.filter((_, i) => i !== index) || []
                      setQuestionForm(prev => ({ ...prev, blanks: newBlanks }))
                    }}
                    aria-label="Remove blank"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setQuestionForm(prev => ({
                    ...prev,
                    blanks: [...(prev.blanks || []), '']
                  }))
                }}
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Add Blank
              </Button>
              {errors.blanks && <p className="text-red-500 text-sm mt-1">{errors.blanks}</p>}
            </div>
          </div>
        )

      case 'matching':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Left Column</label>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Right Column</label>
              </div>
            </div>
            {(questionForm.pairs || []).map((pair, index) => (
              <div key={index} className="grid grid-cols-2 gap-4 items-center">
                <Input
                  value={pair.left}
                  onChange={(e) => updateMatchingPair(index, 'left', e.target.value)}
                  placeholder="Left item"
                />
                <div className="flex items-center gap-2">
                  <Input
                    value={pair.right}
                    onChange={(e) => updateMatchingPair(index, 'right', e.target.value)}
                    placeholder="Right item"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeMatchingPair(index)}
                    aria-label="Remove pair"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addMatchingPair}
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Add Pair
            </Button>
            {errors.pairs && <p className="text-red-500 text-sm mt-1">{errors.pairs}</p>}
          </div>
        )

      default:
        return null
    }
  }

  if (!user || user.role !== 'instructor') {
    return (
      <Card className="p-6">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-600">Only instructors can create quizzes.</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Quiz Builder</h1>
        <p className="text-gray-600">Create and manage quiz questions for your lesson.</p>
      </div>

      {/* Quiz Settings */}
      <Card className="p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Quiz Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Quiz Title *</label>
            <Input
              value={quiz.title}
              onChange={(e) => setQuiz(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter quiz title"
              className={errors.title ? 'border-red-500' : ''}
            />
            {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Time Limit (minutes)</label>
            <Input
              type="number"
              value={quiz.timeLimit || ''}
              onChange={(e) => setQuiz(prev => ({ ...prev, timeLimit: parseInt(e.target.value) || undefined }))}
              placeholder="No time limit"
              aria-label="Time Limit (minutes)"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">Description</label>
            <Textarea
              value={quiz.description || ''}
              onChange={(e) => setQuiz(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter quiz description"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Passing Score (%)</label>
            <Input
              type="number"
              min="0"
              max="100"
              value={quiz.passingScore}
              onChange={(e) => setQuiz(prev => ({ ...prev, passingScore: parseInt(e.target.value) || 70 }))}
              aria-label="Passing Score (%)"
            />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Shuffle questions</label>
              <Switch
                checked={quiz.shuffleQuestions || false}
                onChange={(checked) => setQuiz(prev => ({ ...prev, shuffleQuestions: checked }))}
                aria-label="Shuffle questions"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Show results immediately</label>
              <Switch
                checked={quiz.showResultsImmediately || false}
                onChange={(checked) => setQuiz(prev => ({ ...prev, showResultsImmediately: checked }))}
                aria-label="Show results immediately"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Allow retakes</label>
              <Switch
                checked={quiz.allowRetakes || false}
                onChange={(checked) => setQuiz(prev => ({ ...prev, allowRetakes: checked }))}
                aria-label="Allow retakes"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Questions */}
      <Card className="p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Questions</h2>
          <Button onClick={handleAddQuestion}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Question
          </Button>
        </div>

        {errors.questions && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{errors.questions}</p>
          </div>
        )}

        {quiz.questions.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">
              <ClockIcon className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No questions added yet</h3>
            <p className="text-gray-600">Click "Add Question" to get started</p>
          </div>
        ) : (
          <DragDropContext onDragEnd={handleQuestionReorder}>
            <Droppable droppableId="questions">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                  {quiz.questions.map((question, index) => (
                    <Draggable key={question.id} draggableId={question.id} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className="bg-gray-50 rounded-lg p-4 border"
                          data-testid="question-item"
                        >
                          <div className="flex items-start gap-3">
                            <div
                              {...provided.dragHandleProps}
                              className="mt-1 text-gray-400 hover:text-gray-600 cursor-grab"
                              aria-label="Drag to reorder"
                            >
                              <GripVerticalIcon className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <Badge variant="secondary" className="mb-2">
                                    {QUESTION_TYPES.find(t => t.value === question.type)?.label}
                                  </Badge>
                                  <h4 className="font-medium text-gray-900">{question.question}</h4>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-gray-500">{question.points} pts</span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditQuestion(question)}
                                    aria-label="Edit question"
                                  >
                                    <PencilIcon className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteQuestion(question.id)}
                                    aria-label="Delete question"
                                  >
                                    <TrashIcon className="h-4 w-4 text-red-500" />
                                  </Button>
                                </div>
                              </div>
                              {question.options && (
                                <div className="text-sm text-gray-600">
                                  {question.options.map((option, i) => (
                                    <div key={option.id} className="flex items-center gap-2">
                                      {option.is_correct ? (
                                        <CheckCircleIcon className="h-4 w-4 text-green-500" />
                                      ) : (
                                        <XCircleIcon className="h-4 w-4 text-gray-300" />
                                      )}
                                      {option.text}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={handleCancel}>
          Cancel
        </Button>
        <Button onClick={handleSaveQuiz}>
          Save Quiz
        </Button>
      </div>

      {/* Question Modal */}
      <Modal
        isOpen={isQuestionModalOpen}
        onClose={() => setIsQuestionModalOpen(false)}
        title={editingQuestion ? 'Edit Question' : 'Add Question'}
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Question Type</label>
            <Select
              value={questionForm.type}
              onChange={(value) => setQuestionForm(prev => ({ 
                ...prev, 
                type: value as QuestionType,
                options: value === 'multiple_choice' ? [
                  { id: '1', text: 'Option 1', is_correct: false },
                  { id: '2', text: 'Option 2', is_correct: false },
                ] : [],
                correctAnswer: undefined,
                pairs: value === 'matching' ? [{ left: '', right: '' }] : undefined,
                blanks: value === 'fill_blank' ? [''] : undefined,
              }))}
              options={QUESTION_TYPES.map(type => ({
                value: type.value,
                label: type.label,
                description: type.description,
              }))}
            />
          </div>

          {questionForm.type !== 'fill_blank' && (
            <div>
              <label className="block text-sm font-medium mb-2">Question *</label>
              <Textarea
                value={questionForm.question}
                onChange={(e) => setQuestionForm(prev => ({ ...prev, question: e.target.value }))}
                placeholder="Enter your question"
                rows={3}
                className={errors.question ? 'border-red-500' : ''}
              />
              {errors.question && <p className="text-red-500 text-sm mt-1">{errors.question}</p>}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Points</label>
            <Input
              type="number"
              min="1"
              value={questionForm.points}
              onChange={(e) => setQuestionForm(prev => ({ ...prev, points: parseInt(e.target.value) || 1 }))}
            />
          </div>

          {renderQuestionForm()}

          <div>
            <label className="block text-sm font-medium mb-2">Explanation (optional)</label>
            <Textarea
              value={questionForm.explanation || ''}
              onChange={(e) => setQuestionForm(prev => ({ ...prev, explanation: e.target.value }))}
              placeholder="Explain the correct answer"
              rows={2}
            />
          </div>

          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{errors.submit}</p>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsQuestionModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveQuestion}>
              Save Question
            </Button>
          </div>
        </div>
      </Modal>

      {/* Cancel Confirmation Modal */}
      <Modal
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        title="Discard changes?"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            You have unsaved changes. Are you sure you want to discard them?
          </p>
          <div className="flex items-center justify-end gap-3">
            <Button variant="outline" onClick={() => setShowCancelConfirm(false)}>
              Keep Editing
            </Button>
            <Button variant="destructive" onClick={confirmCancel}>
              Confirm Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}