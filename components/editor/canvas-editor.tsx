"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { Download, ImageIcon, Loader2, Music, Type } from "lucide-react";
import { useCanvas } from "./use-canvas";
import { useState } from "react";
import { CANVAS_HEIGHT, CANVAS_SETTINGS, CANVAS_WIDTH } from "./canvas";
import { useFFMPEG } from "./use-ffmpeg";

interface AudioState {
  file: File | null;
  url: string | null;
}

export default function CanvasEditor() {
  const { pngToFadeInVideo } = useFFMPEG();
  const [exporting, setExporting] = useState(false);
  const [canvasRef, state, actions] = useCanvas();
  const [audio, setAudio] = useState<AudioState>({
    file: null,
    url: null,
  });

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file && file.type.startsWith("audio/")) {
      const url = URL.createObjectURL(file);
      setAudio({
        file,
        url,
      });
    }
  };

  const exportMedia = async (type: "image" | "video") => {
    try {
      setExporting(true);

      if (type === "image") {
      } else {
        const image = canvasRef.current?.toDataURL("image/png");

        if (!image) {
          throw new Error("Failed to export video");
        }

        await pngToFadeInVideo({
          image,
          audio: audio.url ? audio.url : undefined,
        });
      }
    } catch (e) {
      console.log(e);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {exporting && (
        <div
          data-state={exporting ? "open" : "closed"}
          className="fixed pointer-events-none inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        >
          <div className="flex flex-col items-center gap-4 justify-center h-full w-full">
            <Loader2 className="animate-spin w-8 h-8" />
            <p className="text-white text-lg">Exporting...</p>
          </div>
        </div>
      )}
      {/* Editing Tools - Left Side */}
      <Card className="lg:col-span-5 relative">
        <CardContent className="p-6 space-y-6">
          {/* Text Controls */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="text-input">Add Text</Label>
              <div className="flex gap-2">
                <Input
                  id="text-input"
                  value={state.text}
                  onChange={(e) => actions.setText(e.target.value)}
                  placeholder="Enter text..."
                />
                <Button onClick={actions.addText} size="icon">
                  <Type className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Font Size</Label>
              <Slider
                value={[state.fontSize]}
                onValueChange={(value) => actions.setFontSize(value[0])}
                min={CANVAS_SETTINGS.font.minSize}
                max={CANVAS_SETTINGS.font.maxSize}
                step={CANVAS_SETTINGS.font.step}
              />
              <div className="text-sm text-muted-foreground text-center">
                {state.fontSize}px
              </div>
            </div>

            <div className="space-y-2">
              <Label>Header Height</Label>
              <Slider
                value={[state.headerStyle.height]}
                onValueChange={(value) => actions.setHeaderHeight(value[0])}
                min={16}
                max={CANVAS_HEIGHT}
                step={10}
              />
              <div className="text-sm text-muted-foreground text-center">
                {state.headerStyle.height}px
              </div>
            </div>
          </div>

          {/* Image Controls */}
          <div className="space-y-4">
            <div className="flex flex-row gap-4">
              <div>
                <Input
                  id="image-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={actions.handleImageUpload}
                />
                <Button
                  variant={"secondary"}
                  onClick={() =>
                    document.getElementById("image-input")?.click()
                  }
                  className="w-full"
                >
                  <ImageIcon />
                  Upload Image
                </Button>
              </div>
              <div>
                <Input
                  id="audio-input"
                  type="file"
                  accept="audio/mp3,audio/wav"
                  className="hidden"
                  onChange={handleAudioUpload}
                />
                <Button
                  variant={"secondary"}
                  onClick={() =>
                    document.getElementById("audio-input")?.click()
                  }
                  className="w-full"
                >
                  <Music />
                  Upload Audio
                </Button>
              </div>
            </div>

            {state.selectedImage && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Image Scale</Label>
                  <Slider
                    value={[state.imageStyle.scale]}
                    onValueChange={(value) => actions.setImageScale(value[0])}
                    min={0.1}
                    max={2}
                    step={0.1}
                  />
                  <div className="text-sm text-muted-foreground text-center">
                    {(state.imageStyle.scale * 100).toFixed(0)}%
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Image Width</Label>
                    <Slider
                      value={[state.imageStyle.dimensions.width]}
                      onValueChange={(value) => actions.setImageWidth(value[0])}
                      min={25}
                      max={CANVAS_WIDTH}
                      step={10}
                    />
                    <div className="text-sm text-muted-foreground text-center">
                      {Math.round(state.imageStyle.dimensions.width)}px
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Image Height</Label>
                    <Slider
                      value={[state.imageStyle.dimensions.height]}
                      onValueChange={(value) =>
                        actions.setImageHeight(value[0])
                      }
                      min={200}
                      max={CANVAS_HEIGHT - state.headerStyle.height}
                      step={10}
                    />
                    <div className="text-sm text-muted-foreground text-center">
                      {Math.round(state.imageStyle.dimensions.height)}px
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Audio Player */}
            {audio.url && (
              <div className="space-y-2">
                <Label>Audio Preview</Label>
                <audio controls className="w-full" src={audio.url}>
                  Your browser does not support the audio element.
                </audio>
              </div>
            )}
          </div>

          {/* Export Button */}
          <Button onClick={() => exportMedia("video")} className="w-full">
            <Download className="h-4 w-4 mr-2" />
            Export Video
          </Button>

          <Button
            size={"sm"}
            variant={"secondary"}
            className="absolute bottom-6 right-6"
            onClick={() => actions.resetToDefaults()}
          >
            Reset
          </Button>
        </CardContent>
      </Card>

      {/* Canvas Preview - Right Side */}

      <div className="flex justify-center lg:col-span-7">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="border shadow-lg max-h-[80vh] w-auto rounded-lg"
          onMouseDown={actions.handleMouseDown}
          onMouseMove={actions.handleMouseMove}
          onMouseUp={actions.handleMouseUp}
          onMouseLeave={actions.handleMouseUp}
        />
      </div>
    </div>
  );
}