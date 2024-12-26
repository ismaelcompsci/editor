import { FFmpeg as FFmpegBase } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";

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
