"use client";
import "react-mirt/dist/css/react-mirt.css";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AudioLines, Loader2 } from "lucide-react";
import Mirt from "react-mirt";
import { useCallback, useState } from "react";

interface AudioDialogProps {
  audioFile: File | null;
  onStartChanged?: (start: number) => void;
}

export function AudioDialog({ audioFile, onStartChanged }: AudioDialogProps) {
  const [waveformLoaded, setWaveformLoaded] = useState(false);
  const [time, setTime] = useState({
    start: 0,
    end: 0,
    current: 0,
  });

  const reset = () => {
    setTime({
      start: 0,
      end: 0,
      current: 0,
    });
    setWaveformLoaded(false);
  };

  const handleTimeChange = useCallback(
    (newTime: { start: number; end: number; current: number }) => {
      setTime(newTime);

      if (newTime.start !== time.start) {
        onStartChanged?.(time.start);
      }
    },
    [onStartChanged, time.start]
  );

  return (
    <Dialog onOpenChange={(open) => !open && reset()}>
      <DialogTrigger asChild className="w-full">
        <Button className="w-full" variant="secondary">
          <AudioLines />
          Edit Audio
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Audio</DialogTitle>
          <DialogDescription>
            Upload an audio file to add background music to your video.
            Supported formats: mp3, wav. We grag the first 6 seconds of the
            audio.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          {waveformLoaded === false && (
            <div>
              <Loader2 className="animate-spin" />
            </div>
          )}

          <div className="space-x-2">
            <span>start: {time.start / 1000}</span>
            <span>current: {time.current / 1000}</span>
            <span>end: {time.end / 1000}</span>
          </div>

          <Mirt
            className="[--mirt-frame-color:var(--ds-blue-800)]"
            file={audioFile}
            onChange={handleTimeChange}
            onWaveformLoaded={() => setWaveformLoaded(true)}
          />
        </div>
        <DialogFooter className="sm:justify-start">
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
