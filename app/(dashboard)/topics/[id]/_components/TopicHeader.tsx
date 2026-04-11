'use client'

import React from 'react'
import { PageHeader } from '@/components/common'

interface TopicHeaderProps {
  topic: any
}

export function TopicHeader({ topic }: TopicHeaderProps) {
  const backHref = topic?.subjectId?._id 
    ? `/subjects/${topic.subjectId._id}` 
    : (topic?.subjectId ? `/subjects/${topic.subjectId}` : '/dashboard')

  const subjectTitle = topic?.subjectId?.title || 'Subject'
  const topicTitle = topic?.title || 'Loading...'

  return (
    <PageHeader
      title={subjectTitle}
      subtitle={`Topic: ${topicTitle}`}
      backHref={backHref}
      backLabel="Subject"
      titleClassName="text-2xl md:text-3xl"
    />
  )
}
