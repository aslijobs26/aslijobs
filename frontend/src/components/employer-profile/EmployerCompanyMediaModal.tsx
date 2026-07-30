"use client";

import { EmployerProfileDialog } from "@/components/employer-profile/EmployerProfileDialog";
import {
  EMPLOYER_REGISTER_DOCUMENT_MAX_SIZE_BYTES,
  EMPLOYER_REGISTER_IMAGE_ACCEPT,
  EMPLOYER_REGISTER_IMAGE_UPLOAD_HINT,
} from "@/constants/employer-register";
import type { EmployerProfilePublic } from "@/services/employer-profile.service";
import type { EmployerImageAssetPublic } from "@/services/employer-register.service";
import { resolveMediaUrl } from "@/utils/resolve-media-url";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  ImagePlus,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";

type NewMediaItem = {
  id: string;
  file: File;
  previewUrl: string;
};

type MediaPreview = {
  src: string;
  alt: string;
};

type ReplacementTarget =
  | { kind: "existing"; asset: EmployerImageAssetPublic }
  | { kind: "new"; id: string };

type EmployerCompanyMediaModalProps = {
  profile: EmployerProfilePublic;
  isSaving: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onSave: (input: {
    files: File[];
    removedKeys: string[];
    order: string[];
  }) => Promise<void>;
};

function getAssetKey(asset: EmployerImageAssetPublic): string {
  return asset.publicId.trim() || asset.storagePath.trim();
}

function isAcceptedImage(file: File): boolean {
  return (
    ["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(
      file.type,
    ) && file.size <= EMPLOYER_REGISTER_DOCUMENT_MAX_SIZE_BYTES
  );
}

function createNewMediaItem(file: File): NewMediaItem {
  return {
    id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
    file,
    previewUrl: URL.createObjectURL(file),
  };
}

export function EmployerCompanyMediaModal({
  profile,
  isSaving,
  errorMessage,
  onClose,
  onSave,
}: EmployerCompanyMediaModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const replacementInputRef = useRef<HTMLInputElement>(null);
  const initialMedia = useMemo(() => profile.companyMedia ?? [], [profile]);
  const [existingMedia, setExistingMedia] =
    useState<EmployerImageAssetPublic[]>(initialMedia);
  const [removedKeys, setRemovedKeys] = useState<string[]>([]);
  const [newMedia, setNewMedia] = useState<NewMediaItem[]>([]);
  const newMediaRef = useRef<NewMediaItem[]>([]);
  const [localError, setLocalError] = useState<string | null>(null);
  const [preview, setPreview] = useState<MediaPreview | null>(null);
  const [replacementTarget, setReplacementTarget] =
    useState<ReplacementTarget | null>(null);
  const mediaLimit = profile.companyMediaLimit;
  const availableSlots = Math.max(
    0,
    mediaLimit - existingMedia.length - newMedia.length,
  );

  useEffect(() => {
    newMediaRef.current = newMedia;
  }, [newMedia]);

  useEffect(() => {
    return () => {
      newMediaRef.current.forEach((item) =>
        URL.revokeObjectURL(item.previewUrl),
      );
    };
  }, []);

  const handleFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? []);
    event.target.value = "";
    setLocalError(null);

    const invalid = selected.find((file) => !isAcceptedImage(file));
    if (invalid) {
      setLocalError(`Invalid image. ${EMPLOYER_REGISTER_IMAGE_UPLOAD_HINT}.`);
      return;
    }

    if (selected.length > availableSlots) {
      setLocalError(
        `You can add ${availableSlots} more ${availableSlots === 1 ? "image" : "images"}.`,
      );
      return;
    }

    setNewMedia((current) => [
      ...current,
      ...selected.map(createNewMediaItem),
    ]);
  };

  const handleReplacement = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    setLocalError(null);

    if (!file || !replacementTarget) {
      return;
    }
    if (!isAcceptedImage(file)) {
      setLocalError(`Invalid image. ${EMPLOYER_REGISTER_IMAGE_UPLOAD_HINT}.`);
      return;
    }

    const replacement = createNewMediaItem(file);
    if (replacementTarget.kind === "existing") {
      removeExisting(replacementTarget.asset);
      setNewMedia((current) => [...current, replacement]);
    } else {
      setNewMedia((current) =>
        current.map((item) => {
          if (item.id !== replacementTarget.id) {
            return item;
          }
          URL.revokeObjectURL(item.previewUrl);
          return replacement;
        }),
      );
    }
    setReplacementTarget(null);
  };

  const openReplacement = (target: ReplacementTarget) => {
    setLocalError(null);
    setReplacementTarget(target);
    replacementInputRef.current?.click();
  };

  const removeExisting = (asset: EmployerImageAssetPublic) => {
    const key = getAssetKey(asset);
    setExistingMedia((current) =>
      current.filter((item) => getAssetKey(item) !== key),
    );
    setRemovedKeys((current) =>
      current.includes(key) ? current : [...current, key],
    );
  };

  const removeNew = (id: string) => {
    setNewMedia((current) => {
      const target = current.find((item) => item.id === id);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return current.filter((item) => item.id !== id);
    });
  };

  const moveExisting = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= existingMedia.length) {
      return;
    }
    setExistingMedia((current) => {
      const next = [...current];
      const [item] = next.splice(index, 1);
      if (item) {
        next.splice(nextIndex, 0, item);
      }
      return next;
    });
  };

  const moveNew = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= newMedia.length) {
      return;
    }
    setNewMedia((current) => {
      const next = [...current];
      const [item] = next.splice(index, 1);
      if (item) {
        next.splice(nextIndex, 0, item);
      }
      return next;
    });
  };

  return (
    <EmployerProfileDialog
      title="Edit company media"
      description={`Upload, remove and reorder up to ${mediaLimit} company images.`}
      onClose={onClose}
      wide
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border-subtle px-4 text-sm font-semibold text-muted hover:bg-hero-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={() =>
              void onSave({
                files: newMedia.map((item) => item.file),
                removedKeys,
                order: existingMedia.map(getAssetKey),
              })
            }
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-surface hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-60"
          >
            {isSaving ? "Saving…" : "Save media"}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {preview ? (
          <div className="overflow-hidden rounded-xl border border-border-subtle bg-hero-bg">
            <div className="flex items-center justify-between gap-3 border-b border-border-subtle px-3 py-2">
              <p className="truncate text-sm font-semibold text-foreground">
                {preview.alt}
              </p>
              <button
                type="button"
                onClick={() => setPreview(null)}
                className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-primary-light hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                aria-label="Close image preview"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
            <div className="flex min-h-48 items-center justify-center p-3">
              {/* eslint-disable-next-line @next/next/no-img-element -- authenticated or local preview URL */}
              <img
                src={preview.src}
                alt={preview.alt}
                decoding="async"
                className="max-h-[50dvh] max-w-full object-contain"
              />
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {existingMedia.map((asset, index) => {
            const key = getAssetKey(asset);
            const imageUrl = resolveMediaUrl(asset.url) ?? "";
            const imageAlt = asset.originalName || `Company image ${index + 1}`;
            return (
              <article
                key={key}
                className="overflow-hidden rounded-xl border border-border-subtle bg-hero-bg/50"
              >
                <button
                  type="button"
                  onClick={() => setPreview({ src: imageUrl, alt: imageAlt })}
                  className="group block aspect-[4/3] w-full overflow-hidden bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30"
                  aria-label={`View ${imageAlt}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- authenticated upload URL */}
                  <img
                    src={imageUrl}
                    alt={imageAlt}
                    loading="lazy"
                    decoding="async"
                    className="size-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
                  />
                </button>
                <div className="grid grid-cols-3 gap-1 p-1">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => moveExisting(index, -1)}
                    className="inline-flex min-h-11 items-center justify-center rounded-lg text-muted hover:bg-primary-light hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-30"
                    aria-label={`Move ${asset.originalName || "image"} left`}
                  >
                    <ArrowLeft className="size-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    disabled={index === existingMedia.length - 1}
                    onClick={() => moveExisting(index, 1)}
                    className="inline-flex min-h-11 items-center justify-center rounded-lg text-muted hover:bg-primary-light hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-30"
                    aria-label={`Move ${asset.originalName || "image"} right`}
                  >
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreview({ src: imageUrl, alt: imageAlt })}
                    className="inline-flex min-h-11 items-center justify-center rounded-lg text-muted hover:bg-primary-light hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                    aria-label={`View ${imageAlt}`}
                  >
                    <Eye className="size-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      openReplacement({ kind: "existing", asset })
                    }
                    className="inline-flex min-h-11 items-center justify-center rounded-lg text-muted hover:bg-primary-light hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                    aria-label={`Replace ${imageAlt}`}
                  >
                    <RefreshCw className="size-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeExisting(asset)}
                    className="inline-flex min-h-11 items-center justify-center rounded-lg text-pin-state hover:bg-hero-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pin-state/30"
                    aria-label={`Delete ${asset.originalName || "company image"}`}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                </div>
              </article>
            );
          })}

          {newMedia.map((item, index) => (
            <article
              key={item.id}
              className="overflow-hidden rounded-xl border border-primary/30 bg-primary-light/30"
            >
              <button
                type="button"
                onClick={() =>
                  setPreview({
                    src: item.previewUrl,
                    alt: item.file.name,
                  })
                }
                className="group block aspect-[4/3] w-full overflow-hidden bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30"
                aria-label={`View ${item.file.name}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- local object URL preview */}
                <img
                  src={item.previewUrl}
                  alt={item.file.name}
                  className="size-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
                />
              </button>
              <div className="grid grid-cols-3 gap-1 p-1">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => moveNew(index, -1)}
                  className="inline-flex min-h-11 items-center justify-center rounded-lg text-muted hover:bg-primary-light hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-30"
                  aria-label={`Move ${item.file.name} left`}
                >
                  <ArrowLeft className="size-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  disabled={index === newMedia.length - 1}
                  onClick={() => moveNew(index, 1)}
                  className="inline-flex min-h-11 items-center justify-center rounded-lg text-muted hover:bg-primary-light hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-30"
                  aria-label={`Move ${item.file.name} right`}
                >
                  <ArrowRight className="size-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setPreview({
                      src: item.previewUrl,
                      alt: item.file.name,
                    })
                  }
                  className="inline-flex min-h-11 items-center justify-center rounded-lg text-muted hover:bg-primary-light hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  aria-label={`View ${item.file.name}`}
                >
                  <Eye className="size-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    openReplacement({ kind: "new", id: item.id })
                  }
                  className="inline-flex min-h-11 items-center justify-center rounded-lg text-muted hover:bg-primary-light hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  aria-label={`Replace ${item.file.name}`}
                >
                  <RefreshCw className="size-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => removeNew(item.id)}
                  className="inline-flex min-h-11 items-center justify-center rounded-lg text-pin-state hover:bg-hero-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pin-state/30"
                  aria-label={`Remove new image ${index + 1}`}
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </div>
            </article>
          ))}

          {availableSlots > 0 ? (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex min-h-36 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-primary/30 bg-primary-light/30 p-3 text-center text-primary hover:border-primary hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              <ImagePlus className="size-6" aria-hidden="true" />
              <span className="text-sm font-semibold">Add images</span>
              <span className="text-xs text-muted">
                {availableSlots} of {mediaLimit} remaining
              </span>
            </button>
          ) : null}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={EMPLOYER_REGISTER_IMAGE_ACCEPT}
          multiple
          className="sr-only"
          onChange={handleFiles}
        />
        <input
          ref={replacementInputRef}
          type="file"
          accept={EMPLOYER_REGISTER_IMAGE_ACCEPT}
          className="sr-only"
          onChange={handleReplacement}
        />

        {localError || errorMessage ? (
          <p className="text-sm font-medium text-pin-state" role="alert">
            {localError ?? errorMessage}
          </p>
        ) : null}
      </div>
    </EmployerProfileDialog>
  );
}
