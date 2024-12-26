import { useCallback, useState } from "react";
import { fetchFile } from "@ffmpeg/util";
import { getFFmpegInstance } from "@/lib/ffmpeg";

type UseFFmpegHook = {
  loaded: boolean;
  isLoading: boolean;
  load: () => Promise<void>;
  pngToFadeInVideo: (info: { image: string; audio?: string }) => Promise<void>;
};

export const useFFMPEG = (): UseFFmpegHook => {
  const [loaded, setLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(async () => {
    if (loaded || isLoading) return;
    setIsLoading(true);

    await getFFmpegInstance();
    setLoaded(true);
    setIsLoading(false);
  }, [loaded, isLoading]);

  const pngToFadeInVideo = async ({
    image,
    audio,
  }: {
    image: string;
    audio?: string;
  }) => {
    const ffmpeg = await getFFmpegInstance();
    const fadeInImage = await fetchFile(image);

    ffmpeg.writeFile("input.png", fadeInImage);

    if (audio) {
      await ffmpeg.writeFile("music.mp3", await fetchFile(audio));
      await ffmpeg.exec(audioExec);
    } else {
      // Execute ffmpeg command
      await ffmpeg.exec(videoExec);
    }

    const outputFileBuffer = await ffmpeg.readFile("output.mp4");
    const blob = new Blob([outputFileBuffer], { type: "video/mp4" });
    const videoUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = videoUrl;
    link.download = "output.mp4";
    link.click();
  };

  return { loaded, isLoading, load, pngToFadeInVideo };
};

const audioExec = [
  "-loop",
  "1",
  "-i",
  "input.png",
  "-i",
  "music.mp3",
  "-ss",
  "0",
  "-t",
  "6",
  "-c:v",
  "libx264",
  "-c:a",
  "aac",
  "-b:a",
  "192k",
  "-vf",
  "fade=in:st=0:d=2.4,fade=out:st=5.5:d=0.5",
  "-af",
  "afade=t=in:st=0:d=0.5,afade=t=out:st=5.5:d=0.5",
  "-shortest",
  "-pix_fmt",
  "yuv420p",
  "-preset",
  "medium",
  "-crf",
  "23",
  "-r",
  "30",
  "output.mp4",
];

const videoExec = [
  "-loop",
  "1",
  "-i",
  "input.png",
  "-c:v",
  "libx264",
  "-t",
  "6",
  "-vf",
  "fade=in:st=0:d=2.4,fade=out:st=5.5:d=0.5",
  "-pix_fmt",
  "yuv420p",
  "-preset",
  "medium",
  "-crf",
  "23",
  "-r",
  "30",
  "output.mp4",
];
