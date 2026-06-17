import liveEditingImg from '../../assets/live_editing.png';
import livePreviewImg from '../../assets/live_preview_with_content.svg';
import commentsImg from '../../assets/codereview_ui_v4.svg';

export const demos = [
  {
    id: 0,
    title: 'Live editing',
    description:
      'Syntax highlighting, multi-file tabs, and live cursors keep every reviewer on the same page.',
    image: liveEditingImg,
    imageAlt: 'Collaborative code editor with live cursors from multiple reviewers',
    imageAspect: '680 / 280',
  },
  {
    id: 1,
    title: 'Live previews',
    description:
      'See React, TypeScript, and Node apps run as your team reviews — no local setup required.',
    image: livePreviewImg,
    imageAlt: 'Live preview pane showing a running React application',
    imageAspect: '680 / 368',
  },
  {
    id: 2,
    title: 'Comments & voice notes',
    description:
      'Pin feedback to exact lines with text or short voice notes so context never gets lost.',
    image: commentsImg,
    imageAlt: 'Comments sidebar with text feedback and voice note playback',
    imageAspect: '680 / 270',
  },
];
