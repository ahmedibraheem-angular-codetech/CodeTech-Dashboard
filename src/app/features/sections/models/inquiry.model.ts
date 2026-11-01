export type InquiryStatus = 'new' | 'progress' | 'closed';

export interface InquiryStamp {
  date: string;
  time: string;
}

export interface InquiryNote extends InquiryStamp {
  id: string;
  body: string;
  author: string;
}

export interface InquiryReply extends InquiryStamp {
  id: string;
  body: string;
  author: string;
}

export interface Inquiry {
  id: string;
  customer: string;
  org: string;
  phone: string;
  email: string;
  product: string;
  status: InquiryStatus;
  date: string;
  time: string;
  body: string;
  notes: InquiryNote[];
  reply: InquiryReply | null;
}
