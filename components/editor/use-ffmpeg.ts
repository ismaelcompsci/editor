import { useCallback, useState } from "react";
import { fetchFile } from "@ffmpeg/util";
import { getFFmpegInstance } from "@/lib/ffmpeg";

type UseFFmpegHook = {
  loaded: boolean;
  isLoading: boolean;
  load: () => Promise<void>;
  pngToFadeInVideo: (info: { image: string; audio?: string }) => Promise<void>;
};

type PngToFadeInVideo = UseFFmpegHook["pngToFadeInVideo"];

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

  const pngToFadeInVideo: PngToFadeInVideo = async ({ image, audio }) => {
    console.log("Getting ffmpeg instance...");
    const ffmpeg = await getFFmpegInstance();
    console.log("ffmpeg instance loaded");

    const fadeInImage = await fetchFile(image);

    ffmpeg.on("progress", (progress) => {
      console.log("progress", progress.progress);
    });

    const picName = "input.png";
    const audioName = "music.mp3";
    const outputName = "output.mp4";

    ffmpeg.writeFile(picName, fadeInImage);

    if (audio) {
      console.log("Writing audio file...");
      await ffmpeg.writeFile(audioName, await fetchFile(audio));
      console.log("Done writing audio file");
      const execCommand = audioExec(picName, audioName, outputName);
      await ffmpeg.exec(execCommand);
    } else {
      // Execute ffmpeg command
      await ffmpeg.exec(videoExec);
    }

    const outputFileBuffer = await ffmpeg.readFile(outputName);
    const blob = new Blob([outputFileBuffer], { type: "video/mp4" });
    const videoUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = videoUrl;
    link.download = outputName;
    link.click();
  };

  return { loaded, isLoading, load, pngToFadeInVideo };
};

const audioExec = (
  picName: string,
  audioName: string,
  // audioStart: number = 0,
  outputName: string
) => [
  "-loop",
  "1",
  "-i",
  picName,
  "-i",
  audioName,
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
  outputName,
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
