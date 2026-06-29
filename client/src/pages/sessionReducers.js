export const initialSessionState = {
  accessState: 'checking',
  isOwner: false,
  joinUrl: '',
  linkCopied: false,
  canEdit: false,
  editRequestPending: false,
  pendingEditRequests: [],
  waitingForCreator: false,
  roomJoined: false,
  sessionEnded: false,
  showRating: false,
  ratingDone: false,
  sessionUsers: [],
  creatorInfo: null,
};

export function sessionStateReducer(state, action) {
  switch (action.type) {
    case 'RESET_FOR_SESSION':
      return { ...initialSessionState, accessState: 'checking' };

    case 'ACCESS_GRANTED':
      return {
        ...state,
        accessState: 'granted',
        isOwner: action.isOwner,
        canEdit: action.isOwner,
        joinUrl: action.joinUrl,
        creatorInfo: action.creatorInfo,
      };

    case 'ACCESS_DENIED':
      return { ...state, accessState: 'denied' };

    case 'SET_JOIN_URL':
      return { ...state, joinUrl: action.joinUrl };

    case 'SET_LINK_COPIED':
      return { ...state, linkCopied: action.copied };

    case 'WAITING_FOR_CREATOR':
      return { ...state, waitingForCreator: true, roomJoined: false };

    case 'RETRY_JOIN':
      return { ...state, waitingForCreator: false, roomJoined: false };

    case 'SESSION_ROLE':
      return {
        ...state,
        canEdit: !!action.canEdit,
        isOwner: !!action.isOwner,
        waitingForCreator: false,
        roomJoined: true,
      };

    case 'EDIT_REQUEST_PENDING':
      return { ...state, editRequestPending: true };

    case 'EDIT_ACCESS_GRANTED':
      return { ...state, canEdit: true, editRequestPending: false };

    case 'EDIT_ACCESS_DENIED':
      return { ...state, editRequestPending: false };

    case 'EDIT_REQUEST_ADD': {
      const { userId, username } = action;
      if (state.pendingEditRequests.some((r) => r.userId === userId)) return state;
      return {
        ...state,
        pendingEditRequests: [...state.pendingEditRequests, { userId, username }],
      };
    }

    case 'EDIT_REQUESTS_SYNC':
      return { ...state, pendingEditRequests: action.requests || [] };

    case 'EDIT_REQUEST_REMOVE':
      return {
        ...state,
        pendingEditRequests: state.pendingEditRequests.filter(
          (r) => r.userId !== action.userId
        ),
      };

    case 'USER_JOINED': {
      const { username, userId, isCreator } = action;
      if (state.sessionUsers.find((u) => u.id === userId)) return state;
      return {
        ...state,
        sessionUsers: [
          ...state.sessionUsers,
          { username, id: userId, isCreator: !!isCreator },
        ],
      };
    }

    case 'SESSION_ENDED':
      return {
        ...state,
        sessionEnded: true,
        showRating: action.showRating ?? state.showRating,
      };

    case 'SESSION_END_DENIED':
      return { ...state, sessionEnded: false, showRating: false };

    case 'OWNER_END_SESSION':
      return { ...state, sessionEnded: true, showRating: true };

    case 'SET_SHOW_RATING':
      return { ...state, showRating: action.show };

    case 'RATING_DONE':
      return { ...state, ratingDone: true, showRating: false };

    default:
      return state;
  }
}

export const initialSidebarState = {
  showFiles: typeof window !== 'undefined' ? window.innerWidth >= 768 : true,
  showComments: typeof window !== 'undefined' ? window.innerWidth >= 768 : true,
  isMobile: typeof window !== 'undefined' ? window.innerWidth < 768 : false,
};

export function sidebarReducer(state, action) {
  switch (action.type) {
    case 'RESIZE': {
      const mobile = action.isMobile;
      return {
        isMobile: mobile,
        showFiles: mobile ? false : true,
        showComments: mobile ? false : true,
      };
    }

    case 'TOGGLE':
      if (action.panel === 'files') return { ...state, showFiles: !state.showFiles };
      if (action.panel === 'comments') return { ...state, showComments: !state.showComments };
      return state;

    case 'CLOSE_MOBILE':
      return state.isMobile
        ? { ...state, showFiles: false, showComments: false }
        : state;

    case 'CLOSE_FILES':
      return { ...state, showFiles: false };

    case 'CLOSE_COMMENTS':
      return { ...state, showComments: false };

    default:
      return state;
  }
}

export const initialOutputState = {
  showOutput: false,
  outputTab: 'preview',
  isFullscreen: false,
  editorHeight: 50,
};

export function outputPanelReducer(state, action) {
  switch (action.type) {
    case 'TOGGLE_OUTPUT':
      return { ...state, showOutput: !state.showOutput, isFullscreen: false };

    case 'SET_TAB':
      return { ...state, outputTab: action.tab };

    case 'TOGGLE_FULLSCREEN':
      return { ...state, isFullscreen: !state.isFullscreen };

    case 'SET_EDITOR_HEIGHT':
      return { ...state, editorHeight: action.height };

    default:
      return state;
  }
}
