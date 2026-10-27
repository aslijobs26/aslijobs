import { useEffect, useId, useRef, useState } from "react";
import { LoaderCircle, Pause, Play } from "lucide-react";
import { fetchWhatsAppInboxMedia } from "../../../services/operations-whatsapp-inbox.service";
import { cn } from "../../../utils/cn";
import {
  buildVoiceWaveformBars,
  claimInboxVoicePlayback,
  formatVoiceClock,
  releaseInboxVoicePlayback,
  resolveAudioBlobType,
} from "../../../utils/inbox-voice-playback";
import { useOperationsTheme } from "../../../providers/theme-provider";

interface InboxVoiceMessagePlayerProps {
  conversationId: string;
  messageId: string;
  mediaMimeType?: string;
  outbound: boolean;
}

export function InboxVoiceMessagePlayer({
  conversationId,
  messageId,
  mediaMimeType,
  outbound,
}: InboxVoiceMessagePlayerProps) {
  const { theme } = useOperationsTheme();
  const isDark = theme === "dark";
  const progressId = useId();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const seekingRef = useRef(false);
  const fetchGenerationRef = useRef(0);

  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const bars = buildVoiceWaveformBars(messageId);
  const progress = duration > 0 ? Math.min(1, currentTime / duration) : 0;

  useEffect(() => {
    fetchGenerationRef.current += 1;
    setObjectUrl(null);
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setError(null);
    setLoading(false);

    const audio = audioRef.current;
    return () => {
      releaseInboxVoicePlayback(messageId);
      if (audio) {
        audio.pause();
        audio.removeAttribute("src");
        audio.load();
      }
    };
  }, [messageId]);

  useEffect(() => {
    if (!objectUrl) return;
    objectUrlRef.current = objectUrl;
    return () => {
      URL.revokeObjectURL(objectUrl);
      if (objectUrlRef.current === objectUrl) {
        objectUrlRef.current = null;
      }
    };
  }, [objectUrl]);

  useEffect(() => {
    if (!objectUrl) return;
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      if (!seekingRef.current) setCurrentTime(audio.currentTime || 0);
    };
    const onDurationChange = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
    };
    const onEnded = () => {
      setPlaying(false);
      setCurrentTime(0);
      audio.currentTime = 0;
      releaseInboxVoicePlayback(messageId);
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onError = () => {
      setPlaying(false);
      setError("This voice message could not be played.");
      releaseInboxVoicePlayback(messageId);
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("durationchange", onDurationChange);
    audio.addEventListener("loadedmetadata", onDurationChange);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("error", onError);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("durationchange", onDurationChange);
      audio.removeEventListener("loadedmetadata", onDurationChange);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("error", onError);
    };
  }, [messageId, objectUrl]);

  async function ensureObjectUrl(): Promise<string> {
    if (objectUrlRef.current) return objectUrlRef.current;
    const generation = fetchGenerationRef.current;
    setLoading(true);
    setError(null);
    try {
      const blob = await fetchWhatsAppInboxMedia(conversationId, messageId);
      if (generation !== fetchGenerationRef.current) {
        throw new Error("media-fetch-stale");
      }
      const mime = resolveAudioBlobType(blob, mediaMimeType);
      const typed =
        blob.type === mime ? blob : new Blob([blob], { type: mime });
      const url = URL.createObjectURL(typed);
      objectUrlRef.current = url;
      setObjectUrl(url);
      return url;
    } catch (error) {
      if (error instanceof Error && error.message === "media-fetch-stale") {
        throw error;
      }
      if (generation === fetchGenerationRef.current) {
        setError("This voice message could not be retrieved.");
      }
      throw new Error("media-fetch-failed");
    } finally {
      if (generation === fetchGenerationRef.current) {
        setLoading(false);
      }
    }
  }

  function stopPlayback() {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    setPlaying(false);
  }

  async function togglePlayback() {
    if (loading) return;
    try {
      const url = await ensureObjectUrl();
      const audio = audioRef.current;
      if (!audio) return;

      if (audio.src !== url) {
        audio.src = url;
        audio.load();
      }

      if (!audio.paused && playing) {
        audio.pause();
        releaseInboxVoicePlayback(messageId);
        return;
      }

      claimInboxVoicePlayback(messageId, stopPlayback);
      try {
        await audio.play();
        setPlaying(true);
      } catch {
        setPlaying(false);
        setError("Playback was blocked. Try again.");
        releaseInboxVoicePlayback(messageId);
      }
    } catch {
      /* error state already set */
    }
  }

  function seekToRatio(ratio: number) {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(duration) || duration <= 0) return;
    const next = Math.min(duration, Math.max(0, ratio * duration));
    audio.currentTime = next;
    setCurrentTime(next);
  }

  async function downloadFallback() {
    try {
      const blob = await fetchWhatsAppInboxMedia(conversationId, messageId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "voice-message";
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("This voice message could not be retrieved.");
    }
  }

  const playedBarClass = outbound
    ? isDark
      ? "bg-[#aebac1]"
      : "bg-[#1fa855]"
    : isDark
      ? "bg-[#00a884]"
      : "bg-[#00a884]";
  const idleBarClass = outbound
    ? isDark
      ? "bg-[#1f6b5c]"
      : "bg-[#aad4b1]"
    : isDark
      ? "bg-[#3b4a54]"
      : "bg-[#c5cdd3]";
  const timeClass = isDark ? "text-[#8696a0]" : "text-[#667781]";
  const playButtonClass = outbound
    ? isDark
      ? "bg-[#1f6b5c] text-[#e9edef] hover:bg-[#24806e]"
      : "bg-[#1fa855] text-white hover:bg-[#189a4b]"
    : isDark
      ? "bg-[#00a884] text-white hover:bg-[#029a78]"
      : "bg-[#00a884] text-white hover:bg-[#029a78]";

  return (
    <div className="w-[min(100%,16.5rem)] min-w-[12.5rem] py-0.5">
      <audio ref={audioRef} preload="metadata" className="hidden" />
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => void togglePlayback()}
          disabled={loading}
          aria-label={playing ? "Pause voice message" : "Play voice message"}
          className={cn(
            "inline-flex size-9 shrink-0 items-center justify-center rounded-full transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00a884] disabled:opacity-70",
            playButtonClass,
          )}
        >
          {loading ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          ) : playing ? (
            <Pause className="size-4 fill-current" aria-hidden="true" />
          ) : (
            <Play className="size-4 fill-current" aria-hidden="true" />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="relative h-7">
            <div
              className="flex h-full items-center gap-[2px]"
              aria-hidden="true"
            >
              {bars.map((height, index) => {
                const filled = (index + 0.5) / bars.length <= progress;
                return (
                  <span
                    key={`${messageId}-${index}`}
                    className={cn(
                      "w-[2.5px] shrink-0 rounded-full transition-colors duration-75",
                      filled ? playedBarClass : idleBarClass,
                    )}
                    style={{ height: `${Math.round(height * 100)}%` }}
                  />
                );
              })}
            </div>
            <label htmlFor={progressId} className="sr-only">
              Voice message progress
            </label>
            <input
              id={progressId}
              type="range"
              min={0}
              max={1000}
              step={1}
              value={Math.round(progress * 1000)}
              disabled={!objectUrl || duration <= 0}
              aria-valuetext={`${formatVoiceClock(currentTime)} of ${formatVoiceClock(duration)}`}
              onPointerDown={() => {
                seekingRef.current = true;
              }}
              onPointerUp={() => {
                seekingRef.current = false;
              }}
              onChange={(event) => {
                seekToRatio(Number(event.target.value) / 1000);
              }}
              className="absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent opacity-0 disabled:cursor-default"
            />
          </div>
          <p className={cn("mt-0.5 text-[11px] tabular-nums leading-none", timeClass)}>
            {formatVoiceClock(currentTime)}
            {duration > 0 ? ` / ${formatVoiceClock(duration)}` : ""}
          </p>
        </div>
      </div>

      {error ? (
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="text-[11px] text-danger" role="alert">
            {error}
          </p>
          <button
            type="button"
            onClick={() => void downloadFallback()}
            className="text-[11px] font-medium text-[#027eb5] underline"
          >
            Download instead
          </button>
        </div>
      ) : null}
    </div>
  );
}
