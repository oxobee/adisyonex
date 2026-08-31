"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { LinkIcon, PlayIcon, Trash2Icon, UploadIcon } from "lucide-react";
import { toast } from "sonner";

import {
  addVideoLinkAction,
  removeVideoAction,
  uploadVideoAction,
} from "@/actions/settings.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useServerAction } from "@/hooks/use-server-action";
import { embedUrl } from "@/lib/video";
import type { RestaurantVideoDTO } from "@/types/settings";

import { useImageUpload } from "./use-image-upload";

const MAX_VIDEOS = 6;

export function VideosManager({
  videos,
}: {
  readonly videos: readonly RestaurantVideoDTO[];
}) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [caption, setCaption] = useState("");
  const { inputRef, uploading, onFile, open } = useImageUpload(
    uploadVideoAction,
    "Video yüklendi",
  );

  const addLink = useServerAction(addVideoLinkAction, {
    onSuccess: () => {
      toast.success("Video eklendi");
      setUrl("");
      setCaption("");
      router.refresh();
    },
    onError: (message) => toast.error(message),
  });
  const remove = useServerAction(removeVideoAction, {
    onSuccess: () => {
      toast.success("Video kaldırıldı");
      router.refresh();
    },
    onError: (message) => toast.error(message),
  });

  const atCap = videos.length >= MAX_VIDEOS;

  return (
    <div className="flex flex-col gap-4">
      {videos.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {videos.map((video) => {
            const embed = video.kind === "LINK" ? embedUrl(video.url) : null;
            return (
              <div key={video.id} className="flex flex-col gap-1">
                <div className="relative overflow-hidden rounded-md border">
                  {video.kind === "FILE" ? (
                    <video
                      src={video.url}
                      controls
                      className="aspect-video w-full bg-black"
                    />
                  ) : embed ? (
                    <iframe
                      src={embed}
                      title={video.caption ?? "Video"}
                      className="aspect-video w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <a
                      href={video.url}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-muted/40 text-muted-foreground flex aspect-video w-full items-center justify-center gap-2 text-sm"
                    >
                      <PlayIcon className="size-5" /> Videoyu Aç
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => remove.execute({ id: video.id })}
                    className="bg-destructive absolute top-1.5 right-1.5 rounded-full p-1 text-white"
                    aria-label="Videoyu kaldır"
                  >
                    <Trash2Icon className="size-3" />
                  </button>
                </div>
                {video.caption ? (
                  <p className="text-muted-foreground text-xs">{video.caption}</p>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}

      {atCap ? (
        <p className="text-muted-foreground text-sm">
          En fazla {MAX_VIDEOS} video sınırına ulaştınız.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="YouTube / Instagram / Vimeo linki yapıştırın"
            />
            <Input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Başlık (isteğe bağlı)"
              className="sm:w-48"
            />
            <Button
              type="button"
              onClick={() =>
                url.trim() &&
                addLink.execute({
                  url: url.trim(),
                  caption: caption.trim() || undefined,
                })
              }
              disabled={!url.trim() || addLink.isPending}
            >
              <LinkIcon className="size-4" /> Bağlantı Ekle
            </Button>
          </div>
          <div>
            <Button
              type="button"
              variant="outline"
              onClick={open}
              disabled={uploading}
            >
              <UploadIcon className="size-4" />
              {uploading ? "Yükleniyor…" : "Video Dosyası Yükle"}
            </Button>
            <input
              ref={inputRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              className="hidden"
              onChange={onFile}
            />
            <p className="text-muted-foreground mt-1 text-xs">
              MP4 / WebM / MOV, maksimum 25 MB.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
