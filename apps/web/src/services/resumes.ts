import { request } from '@umijs/max';

import type { ResumeDraft, ResumeDraftSummary } from '@/types/resume';
import { hydrateDraft } from '@/utils/resumeDrafts';

type ResumeSummaryDto = {
  id: number;
  title: string;
  headline: string;
  templateId: number | null;
  templateName: string | null;
  status: string;
  visibility: string;
  updatedAt: string;
};

type ResumeDetailDto = {
  id: number;
  title: string;
  templateId: number | null;
  templateName: string | null;
  status: string;
  visibility: string;
  createdAt: string;
  updatedAt: string;
  content: Record<string, unknown>;
};

type ResumeSavePayload = {
  title: string;
  templateId: number | null;
  status: string;
  visibility: string;
  content: Record<string, unknown>;
};

export function buildResumeSavePayload(draft: ResumeDraft): ResumeSavePayload {
  const {
    id: _id,
    updatedAt: _updatedAt,
    title,
    templateId,
    status,
    visibility,
    ...content
  } = draft;

  return {
    title,
    templateId,
    status,
    visibility,
    content,
  };
}

export function mapResumeDetailToDraft(detail: ResumeDetailDto): ResumeDraft {
  const hydrated = hydrateDraft(detail.content, String(detail.id));

  return {
    ...hydrated,
    id: String(detail.id),
    title: detail.title || hydrated.title,
    templateId: detail.templateId,
    status: detail.status || hydrated.status,
    visibility: detail.visibility || hydrated.visibility,
    updatedAt: detail.updatedAt,
  };
}

export async function queryResumes() {
  const data = await request<ResumeSummaryDto[]>('/api/resumes', {
    method: 'GET',
  });

  return data.map<ResumeDraftSummary>((item) => ({
    id: String(item.id),
    title: item.title,
    headline: item.headline,
    templateId: item.templateId,
    templateName: item.templateName,
    status: item.status,
    visibility: item.visibility,
    updatedAt: item.updatedAt,
  }));
}

export async function queryResume(resumeId: string) {
  const detail = await request<ResumeDetailDto>(`/api/resumes/${resumeId}`, {
    method: 'GET',
  });

  return mapResumeDetailToDraft(detail);
}

export async function createResume(draft: ResumeDraft) {
  const detail = await request<ResumeDetailDto>('/api/resumes', {
    method: 'POST',
    data: buildResumeSavePayload(draft),
  });

  return mapResumeDetailToDraft(detail);
}

export async function updateResume(resumeId: string, draft: ResumeDraft) {
  const detail = await request<ResumeDetailDto>(`/api/resumes/${resumeId}`, {
    method: 'PUT',
    data: buildResumeSavePayload(draft),
  });

  return mapResumeDetailToDraft(detail);
}

export async function deleteResume(resumeId: string) {
  return request(`/api/resumes/${resumeId}`, {
    method: 'DELETE',
  });
}
