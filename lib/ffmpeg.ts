import { FFmpeg as FFmpegBase } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";

let ffmpegInstance: FFmpegBase | null = null;
let isLoaded = false;

export const getFFmpegInstance = async (): Promise<FFmpegBase> => {
  if (!ffmpegInstance) {
    ffmpegInstance = new FFmpegBase();
  }

  if (!isLoaded) {
    const [coreURL, wasmURL] = await Promise.all([
      toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
    ]);

    await ffmpegInstance.load({
      coreURL: coreURL,
      wasmURL: wasmURL,
    });
    isLoaded = true;
  }

  return ffmpegInstance;
};

const writeInputFile = async (
  ffmpeg: FFmpegBase,
  file: File,
  fileName: string
) => {
  const fileUrl = URL.createObjectURL(file);
  const fileData = await fetchFile(fileUrl);
  await ffmpeg.writeFile(fileName, fileData);

  return fileName;
};

export const convertToMp4 = async (
  file: File,
  { width, height }: { width: number; height: number },
  cb: (progress: number) => void
) => {
  const startTime = performance.now();
  const ffmpeg = await getFFmpegInstance();

  ffmpeg.on("progress", ({ progress }: { progress: number }) => {
    cb(Math.round(progress * 100));
  });

  const fileName = await writeInputFile(ffmpeg, file, "input.mp4");

  await ffmpeg.exec([
    "-i",
    fileName,
    "-c:v",
    "libx264",
    "-preset",
    "superfast",
    "-movflags",
    "+faststart",
    "-vf",
    `scale=${width}:${height}`,
    "-c:a",
    "aac",
    "-ar",
    "48000",
    "-ac",
    "2",
    "-y",
    "output.mp4",
  ]);

  const outputFileBuffer = await ffmpeg.readFile("output.mp4");
  if (!outputFileBuffer) {
    throw new Error("Failed to read output file");
  }

  const blob = new Blob([outputFileBuffer], { type: "video/mp4" });

  const processedFile = new File(
    [blob],
    // remove extension
    file.name.replace(/\.[^/.]+$/, "") + "_processed.mp4",
    {
      type: "video/mp4",
    }
  );

  cb(100);
  const endTime = performance.now();
  console.log(`Conversion took ${Number(endTime - startTime) / 1000} ms`);
  return processedFile;
};
