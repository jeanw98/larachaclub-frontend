import type { StoryGroup } from '../types';

const SEEN_KEY = 'amici_seen_stories';

function getSeenIds(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || '[]'));
  } catch {
    return new Set();
  }
}

export function isStoryUnseen(group: StoryGroup): boolean {
  const seen = getSeenIds();
  return group.items.some((item) => !seen.has(item.id));
}

export function markStorySeen(pinIds: string[]) {
  const seen = getSeenIds();
  pinIds.forEach((id) => seen.add(id));
  localStorage.setItem(SEEN_KEY, JSON.stringify([...seen]));
}

function StoryThumbnail({ group }: { group: StoryGroup }) {
  const preview = group.items[group.items.length - 1];
  const url = preview.media_url || preview.image_url;
  const isVideo = preview.media_type === 'video';

  return (
    <div className="story-ring-inner">
      {isVideo ? (
        <video
          className="story-thumb-media"
          src={`${url}#t=0.1`}
          muted
          playsInline
          preload="metadata"
        />
      ) : (
        <img className="story-thumb-media" src={url} alt="" />
      )}
      {isVideo && <span className="story-thumb-video">▶</span>}
      {group.items.length > 1 && (
        <span className="story-thumb-count">{group.items.length}</span>
      )}
    </div>
  );
}

interface Props {
  stories: StoryGroup[];
  currentUserId?: string;
  onOpen: (group: StoryGroup, startIndex?: number) => void;
}

export default function StoriesBar({ stories, currentUserId, onOpen }: Props) {
  if (stories.length === 0) return null;

  const myStory = stories.find((s) => s.user_id === currentUserId);
  const others = stories.filter((s) => s.user_id !== currentUserId);

  return (
    <div className="stories-bar">
      <div className="stories-scroll">
        {myStory && (
          <button
            className={`story-avatar ${isStoryUnseen(myStory) ? 'unseen' : 'seen'}`}
            onClick={() => {
              const seen = getSeenIds();
              const firstUnseen = myStory.items.findIndex((i) => !seen.has(i.id));
              onOpen(myStory, firstUnseen >= 0 ? firstUnseen : 0);
            }}
          >
            <div className="story-ring" style={{ borderColor: myStory.avatar_color }}>
              <StoryThumbnail group={myStory} />
            </div>
            <span>Tu historia</span>
          </button>
        )}
        {others.map((group) => (
          <button
            key={group.user_id}
            className={`story-avatar ${isStoryUnseen(group) ? 'unseen' : 'seen'}`}
            onClick={() => {
              const seen = getSeenIds();
              const firstUnseen = group.items.findIndex((i) => !seen.has(i.id));
              onOpen(group, firstUnseen >= 0 ? firstUnseen : 0);
            }}
          >
            <div className="story-ring" style={{ borderColor: group.avatar_color }}>
              <StoryThumbnail group={group} />
            </div>
            <span>{group.nickname}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
